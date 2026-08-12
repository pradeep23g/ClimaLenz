from __future__ import annotations

import logging
import time

import httpx
from fastapi import FastAPI, HTTPException, status

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
    version="0.1.0",
)


@app.get("/health/status", tags=["Diagnostics"])
def get_system_health() -> dict:
    return {"status": "operational", "service": "climalenz-colocation-bridge"}


@app.post(
    "/v1/colocation/assess",
    response_model=CoLocationReport,
    tags=["Core Analysis"],
)
def assess_colocation(payload: CoLocationRequest) -> CoLocationReport:
    """Fetches both engines for the same AOI and returns a combined flag.

    NOTE: geometry (water) and bbox (heat) both describe the same area but
    in different formats, because that's what each engine's confirmed
    schema expects — the caller is responsible for supplying both
    consistently for now. Reconciling that into a single AOI input format
    is a reasonable follow-up once this end-to-end path is proven.
    """
    t_start = time.time()

    t_water_0 = time.time()
    try:
        water_report = fetch_water_assessment(
            payload.spatial_geometry,
            cloud_tolerance_pct=payload.cloud_tolerance_pct,
        )
    except httpx.HTTPStatusError as err:
        logger.error(f"water_engine returned an error: {err}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"water_engine assessment failed: {err.response.text}",
        )
    except httpx.RequestError as err:
        logger.error(f"water_engine unreachable: {err}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not reach water_engine: {err}",
        )
    water_engine_s = round(time.time() - t_water_0, 4)

    t_heat_0 = time.time()
    try:
        heat_result = fetch_heat_simulation(
            payload.bbox, payload.intervention_type, payload.delta
        )
    except httpx.HTTPStatusError as err:
        logger.error(f"heat_engine returned an error: {err}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"heat_engine simulation failed: {err.response.text}",
        )
    except httpx.RequestError as err:
        logger.error(f"heat_engine unreachable: {err}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not reach heat_engine: {err}",
        )
    heat_engine_s = round(time.time() - t_heat_0, 4)

    try:
        result = evaluate_colocation(water_report, heat_result)
    except KeyError as err:
        logger.exception("Response shape from an engine didn't match expectations.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Unexpected response shape from an engine, missing field: {err}",
        )

    total_s = round(time.time() - t_start, 4)
    result["stage_timings"] = {
        "water_engine_s": water_engine_s,
        "heat_engine_s": heat_engine_s,
        "total_s": total_s,
    }

    return CoLocationReport(**result)
