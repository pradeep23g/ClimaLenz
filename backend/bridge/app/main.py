from __future__ import annotations

import logging
import os
import time

import httpx
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.clients import fetch_heat_simulation, fetch_water_assessment
from app.co_location import evaluate_colocation
from app.models import CoLocationReport, CoLocationRequest

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ClimaLenz Co-location Bridge",
    description=(
        "Combines water_engine's deterministic risk score with heat_engine's "
        "physics-guarded PINN output for one AOI. This is the layer that "
        "turns two independent engines into the actual ClimaLenz claim."
    ),
    version="0.2.0",
)

# CORS — the Bridge is the single frontend-facing orchestration boundary.
_cors_origins = os.getenv("CORS_ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health/status", tags=["Diagnostics"])
def get_system_health() -> dict:
    return {"status": "operational", "service": "climalenz-colocation-bridge"}


from app.persistence import (
    get_latest_compatible_snapshot,
    save_verified_snapshot,
    classify_snapshot_freshness,
    get_snapshot_age_minutes,
    _utc_now_iso,
)

@app.post(
    "/v1/colocation/assess",
    response_model=CoLocationReport,
    tags=["Core Analysis"],
)
def assess_colocation(payload: CoLocationRequest) -> CoLocationReport:
    t_start = time.time()
    
    water_report = None
    heat_result = None
    water_err = None
    heat_err = None
    
    t_water_0 = time.time()
    try:
        water_report = fetch_water_assessment(
            payload.spatial_geometry,
            lookback_days=payload.lookback_days,
            cloud_tolerance_pct=payload.cloud_tolerance_pct,
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 422 and "Earth observation data retrieval failed" in e.response.text:
            logger.info("Water engine reported optical-data failure. Triggering Continuity...")
            try:
                from datetime import datetime, timezone, timedelta
                end_date = datetime.now(timezone.utc).date()
                start_date = end_date - timedelta(days=payload.lookback_days)
                
                from app.clients import fetch_continuity_repair
                continuity_res = fetch_continuity_repair(
                    payload.spatial_geometry,
                    start_date.isoformat(),
                    end_date.isoformat()
                )
                
                job_id = continuity_res["job_id"]
                continuity_metadata = {
                    "provenance": "continuity_reconstructed",
                    **continuity_res
                }
                
                logger.info(f"Continuity repair successful. Retrying water assessment with job {job_id}")
                water_report = fetch_water_assessment(
                    payload.spatial_geometry,
                    lookback_days=payload.lookback_days,
                    cloud_tolerance_pct=payload.cloud_tolerance_pct,
                    continuity_job_id=job_id,
                )
                water_report["_continuity_metadata"] = continuity_metadata
            except Exception as ce:
                logger.error(f"Continuity recovery failed: {ce}")
                water_err = f"Water HTTP 422 + Continuity Failure: {ce}"
        else:
            logger.error(f"water_engine returned HTTP {e.response.status_code}: {e.response.text}")
            water_err = f"Water HTTP Error: {e.response.status_code}"
    except Exception as e:
        logger.error(f"water_engine failed: {e}")
        water_err = f"Water Error: {e}"
    water_engine_s = round(time.time() - t_water_0, 4)

    t_heat_0 = time.time()
    try:
        heat_result = fetch_heat_simulation(
            payload.bbox, payload.intervention_type, payload.delta
        )
    except Exception as e:
        logger.error(f"heat_engine failed: {e}")
        heat_err = f"Heat HTTP Error: {e}"
    heat_engine_s = round(time.time() - t_heat_0, 4)

    live_failed = (water_report is None) or (heat_result is None)
    is_synthetic = False
    
    if not live_failed:
        water_provider = water_report.get("data_provider", "")
        is_synthetic = "synthetic" in water_provider.lower()
        
        if is_synthetic:
            live_failed = True
            water_err = "water_engine returned SYNTHETIC data. LKG preferred."
        else:
            try:
                result = evaluate_colocation(water_report, heat_result)
                total_s = round(time.time() - t_start, 4)
                result["stage_timings"] = {
                    "water_engine_s": water_engine_s,
                    "heat_engine_s": heat_engine_s,
                    "total_s": total_s,
                }
                
                # Apply Continuity metadata if it was used
                if "_continuity_metadata" in water_report:
                    result.update(water_report["_continuity_metadata"])

                # --- Agent Intelligence Layer ---
                try:
                    from app.clients import fetch_reporter, fetch_critic
                    import uuid
                    
                    session_id = str(uuid.uuid4())
                    agent_payload = {
                        "water": water_report,
                        "heat": heat_result,
                        "bridge": result,
                        "parameters": {
                            "intervention": payload.intervention_type,
                            "delta": payload.delta,
                            "lookback": payload.lookback_days
                        }
                    }
                    
                    logger.info("Calling Reporter agent...")
                    reporter_res = fetch_reporter(session_id, agent_payload)
                    result["reporter_narrative"] = reporter_res
                    
                    logger.info("Calling Critic agent...")
                    critic_res = fetch_critic(session_id, agent_payload, reporter_res)
                    result["critic_audit"] = critic_res
                    
                except Exception as agent_err:
                    logger.error(f"Agent layer failed: {agent_err}")
                    # Failure does not destroy scientific results
                    
                # Save Verified Snapshot
                save_verified_snapshot(payload, water_report, heat_result, result)
                
                report = CoLocationReport(**result)
                
                # Workaround for Pydantic v2 strictness: dynamically assign extra persistence fields
                # since we might have not perfectly aligned with models.py
                # Our models.py actually has these now!
                report.is_verified = True
                report.computed_at = _utc_now_iso()
                
                return report
                
            except KeyError as err:
                logger.exception("Response shape from an engine didn't match expectations.")
                live_failed = True
                water_err = f"Unexpected response shape: {err}"

    # --- LKG Recovery Path ---
    if live_failed:
        logger.info("Live assessment failed or returned synthetic. Searching for LKG...")
        snapshot = get_latest_compatible_snapshot(payload)
        
        if snapshot:
            logger.info("Valid LKG found.")
            b_res = snapshot.get("bridge_result", {})
            w_res = snapshot.get("water_result", {})
            h_res = snapshot.get("heat_result", {})
            
            cached_result = {
                "triggered": snapshot.get("colocation_trigger", False),
                "water_score": snapshot.get("water_score", 0.0),
                "water_tier": snapshot.get("water_tier", "UNKNOWN"),
                "water_confidence_band": snapshot.get("confidence_band"),
                "heat_guardrail_status": snapshot.get("heat_guardrail_status", "UNKNOWN"),
                "heat_intervention_type": h_res.get("heat_intervention_type", ""),
                "heat_delta_summary": h_res.get("heat_delta_summary", {"min":0,"max":0,"mean":0}),
                "narrative": b_res.get("narrative", ""),
                "stage_timings": b_res.get("stage_timings", {"water_engine_s":0, "heat_engine_s":0, "total_s":0}),
                "reporter_narrative": b_res.get("reporter_narrative"),
                "critic_audit": b_res.get("critic_audit"),
                "provenance": snapshot.get("data_source", "live"),
                "caveats": snapshot.get("source_scene_ids", [])
            }
            
            # Inject persistence metadata
            cached_result["execution_mode"] = "CACHED"
            freshness = classify_snapshot_freshness(snapshot["computed_at"])
            cached_result["data_status"] = f"LAST_KNOWN_GOOD ({freshness})"
            cached_result["is_live"] = False
            cached_result["is_verified"] = True
            cached_result["computed_at"] = snapshot["computed_at"]
            cached_result["age_minutes"] = get_snapshot_age_minutes(snapshot["computed_at"])
            cached_result["snapshot_id"] = snapshot["id"]
            
            err_msg = [e for e in [water_err, heat_err] if e]
            cached_result["fallback_reason"] = " | ".join(err_msg) if err_msg else "LIVE_COMPUTATION_FAILED"
            
            return CoLocationReport(**cached_result)
            
        else:
            logger.info("No LKG found.")
            
            # --- Synthetic Fallback Path (Only if explicitly allowed/generated) ---
            if water_report and heat_result and is_synthetic:
                logger.info("Falling back to synthetic data.")
                try:
                    result = evaluate_colocation(water_report, heat_result)
                    result["stage_timings"] = {
                        "water_engine_s": water_engine_s,
                        "heat_engine_s": heat_engine_s,
                        "total_s": round(time.time() - t_start, 4),
                    }
                    report = CoLocationReport(**result)
                    report.execution_mode = "SYNTHETIC"
                    report.data_status = "DEGRADED_SYNTHETIC"
                    report.is_live = False
                    report.is_verified = False
                    
                    err_msg = [e for e in [water_err, heat_err] if e]
                    report.fallback_reason = " | ".join(err_msg) if err_msg else "LIVE_FAILED_NO_LKG"
                    return report
                except KeyError:
                    pass
            
            # --- Total Failure Path ---
            logger.error("No LKG and no synthetic fallback available.")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Live computation failed, and no valid LKG snapshot exists. Errors: Water: {water_err}, Heat: {heat_err}",
            )

