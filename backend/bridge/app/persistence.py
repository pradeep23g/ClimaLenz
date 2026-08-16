import os
import json
import hashlib
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from dotenv import load_dotenv
from supabase import create_client, Client

logger = logging.getLogger(__name__)

# Load .env from backend root if running directly or via uvicorn
load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

_supabase: Optional[Client] = None

def get_supabase() -> Optional[Client]:
    global _supabase
    if _supabase is None:
        url = os.getenv("SUPABASE_URL", "").strip()
        key = os.getenv("SUPABASE_KEY", "").strip()
        if not url or not key:
            logger.warning("Missing SUPABASE_URL or SUPABASE_KEY. Persistence disabled.")
            return None
        try:
            _supabase = create_client(url, key)
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            return None
    return _supabase

def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def hash_aoi_request(geometry: Dict[str, Any], intervention: str, delta: float, lookback: int, cloud_tol: float) -> str:
    """Creates a deterministic hash of the AOI and assessment parameters."""
    canonical_geom = json.dumps(geometry, sort_keys=True, separators=(',', ':'))
    payload = f"{canonical_geom}|{intervention}|{delta:.4f}|{lookback}|{cloud_tol:.4f}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def classify_snapshot_freshness(computed_at_iso: str) -> str:
    """Classifies age as FRESH (<24h), STALE (24h-72h), EXPIRED (>72h)."""
    try:
        computed_at = datetime.fromisoformat(computed_at_iso.replace('Z', '+00:00'))
        age = datetime.now(timezone.utc) - computed_at
        age_hours = age.total_seconds() / 3600.0
        
        if age_hours < 24:
            return "FRESH"
        elif age_hours <= 72:
            return "STALE"
        else:
            return "EXPIRED"
    except Exception as e:
        logger.error(f"Error classifying freshness: {e}")
        return "EXPIRED"

def get_snapshot_age_minutes(computed_at_iso: str) -> int:
    try:
        computed_at = datetime.fromisoformat(computed_at_iso.replace('Z', '+00:00'))
        age = datetime.now(timezone.utc) - computed_at
        return int(age.total_seconds() / 60.0)
    except Exception:
        return 0

def save_verified_snapshot(
    req: Any,
    water_report: Dict[str, Any],
    heat_result: Dict[str, Any],
    bridge_result: Dict[str, Any],
) -> None:
    client = get_supabase()
    if not client:
        return

    water_score = water_report.get("ecological_risk", {}).get("aggregate_score")
    water_tier = water_report.get("ecological_risk", {}).get("tier")
    confidence_band = water_report.get("data_confidence", {}).get("band", "UNKNOWN")
    heat_guardrail = heat_result.get("guardrail_status")
    colocation_trigger = bridge_result.get("triggered", False)
    
    aoi_hash = hash_aoi_request(
        req.spatial_geometry, 
        req.intervention_type, 
        req.delta, 
        req.lookback_days, 
        req.cloud_tolerance_pct
    )

    water_provider = water_report.get("data_provider", "")
    
    # --- MINIMAL SAFE PERSISTENT REPRESENTATION ---
    request_payload = {
        "geometry": req.spatial_geometry,
        "intervention_type": req.intervention_type,
        "delta": req.delta,
        "lookback_days": req.lookback_days,
        "cloud_tolerance_pct": req.cloud_tolerance_pct
    }
    
    water_minimal = {
        "water_score": water_score,
        "water_tier": str(water_tier),
        "water_confidence_band": confidence_band,
        "metadata": {
            "data_provider": water_provider,
            "scene_cloud_cover_pct": water_report.get("scene_context", {}).get("cloud_cover_pct")
        }
    }
    
    # Calculate Heat delta summary without storing the massive 64x64 grid
    delta_t_grid = heat_result.get("delta_t_grid", [])
    flat_grid = [val for row in delta_t_grid for val in row] if delta_t_grid else []
    heat_summary = {
        "min": min(flat_grid) if flat_grid else 0,
        "max": max(flat_grid) if flat_grid else 0,
        "mean": sum(flat_grid)/len(flat_grid) if flat_grid else 0
    }
    
    heat_minimal = {
        "heat_guardrail_status": heat_guardrail,
        "heat_intervention_type": req.intervention_type,
        "heat_delta_summary": heat_summary,
        "heat_data_provenance": "synthetic_mock_api" if "CLIMALENZ_LOCAL_MOCK_API" in os.environ else "live_planetary_computer"
    }
    
    bridge_minimal = {
        "colocation_triggered": colocation_trigger,
        "narrative": bridge_result.get("narrative", ""),
        "reporter_narrative": bridge_result.get("reporter_narrative"),
        "critic_audit": bridge_result.get("critic_audit"),
        "stage_timings": bridge_result.get("stage_timings", {})
    }

    # Trust / Provenance Fields
    provenance = bridge_result.get("provenance", "live")
    scene_confidence = bridge_result.get("scene_confidence")
    caveats = bridge_result.get("caveats", [])

    payload = {
        "aoi_hash": aoi_hash,
        "request_payload": request_payload,
        "water_result": water_minimal,
        "heat_result": heat_minimal,
        "bridge_result": bridge_minimal,
        "water_score": water_score,
        "water_tier": str(water_tier),
        "heat_guardrail_status": heat_guardrail,
        "colocation_trigger": colocation_trigger,
        "data_source": provenance,
        "execution_mode": "LIVE",
        "data_status": "SUCCESS",
        "confidence_band": confidence_band,
        "is_verified": True,
        "is_latest": True,
        "computed_at": _utc_now_iso(),
        # Store Trust fields safely
        "source_scene_ids": caveats, # Using available JSONB field for caveats
        "fallback_used": True if provenance != "live" else False,
        "fallback_reason": str(scene_confidence) if scene_confidence else None
    }

    try:
        client.table("assessment_snapshots").insert(payload).execute()
        logger.info(f"Saved verified snapshot for AOI hash {aoi_hash}")
    except Exception as e:
        logger.error(f"Failed to persist snapshot: {e}")

def get_latest_compatible_snapshot(req: Any) -> Optional[Dict[str, Any]]:
    client = get_supabase()
    if not client:
        return None
        
    aoi_hash = hash_aoi_request(req.spatial_geometry, req.intervention_type, req.delta, req.lookback_days, req.cloud_tolerance_pct)
    
    try:
        resp = client.table("assessment_snapshots") \
            .select("*") \
            .eq("aoi_hash", aoi_hash) \
            .eq("is_verified", True) \
            .order("computed_at", desc=True) \
            .limit(1) \
            .execute()
            
        if resp.data and len(resp.data) > 0:
            snapshot = resp.data[0]
            freshness = classify_snapshot_freshness(snapshot["computed_at"])
            if freshness == "EXPIRED":
                logger.info(f"Found snapshot for AOI {aoi_hash} but it is EXPIRED.")
                return None
            return snapshot
        return None
    except Exception as e:
        logger.error(f"Failed to fetch compatible snapshot: {e}")
        return None
