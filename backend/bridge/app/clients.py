from __future__ import annotations

import os

import httpx

WATER_ENGINE_URL = os.getenv("WATER_ENGINE_URL", "http://localhost:8001")
HEAT_ENGINE_URL = os.getenv("HEAT_ENGINE_URL", "http://localhost:8002")
CONTINUITY_ENGINE_URL = os.getenv("CONTINUITY_ENGINE_URL", "http://localhost:8003")

def fetch_continuity_repair(geometry: dict, start_date: str, end_date: str) -> dict:
    resp = httpx.post(
        f"{CONTINUITY_ENGINE_URL}/v1/reconstruction/repair",
        json={
            "geometry": geometry,
            "start_date": start_date,
            "end_date": end_date,
        },
        timeout=float(os.getenv("BRIDGE_CONTINUITY_TIMEOUT", "300.0")),
    )
    resp.raise_for_status()
    return resp.json()


def fetch_water_assessment(
    geometry: dict,
    lookback_days: int = 30,
    cloud_tolerance_pct: float = 30.0,
    continuity_job_id: str | None = None,
) -> dict:
    """Calls water_engine's confirmed real endpoint and payload shape.

    Endpoint: POST /v1/assessments/generate
    Payload field names confirmed against app/main.py's AssessmentPayload.
    """
    payload = {
        "spatial_geometry": geometry,
        "observation_lookback_days": lookback_days,
        "cloud_tolerance_pct": cloud_tolerance_pct,
    }
    if continuity_job_id:
        payload["continuity_job_id"] = continuity_job_id
        
    resp = httpx.post(
        f"{WATER_ENGINE_URL}/v1/assessments/generate",
        json=payload,
        timeout=float(os.getenv("BRIDGE_WATER_TIMEOUT", "300.0")),
    )
    resp.raise_for_status()
    return resp.json()  # -> EnvironmentalPipelineReport, JSON-decoded


def fetch_heat_simulation(bbox: list[float], intervention_type: str, delta: float) -> dict:
    """Calls heat_engine's confirmed real endpoint and payload shape.

    Endpoint: POST /v1/simulations/what-if
    Payload field names confirmed against app/models/simulation_schemas.py's
    SimulationRequest (bbox / date_range aren't both required per the
    request schema shown so far — this bridge only needs bbox + intervention
    + delta; extend if date_range turns out to be mandatory on your end).
    """
    resp = httpx.post(
        f"{HEAT_ENGINE_URL}/v1/simulations/what-if",
        json={
            "bbox": bbox,
            "intervention_type": intervention_type,
            "delta": delta,
        },
        timeout=float(os.getenv("BRIDGE_HEAT_TIMEOUT", "300.0")),
    )
    resp.raise_for_status()
    return resp.json()  # -> SimulationResponse, JSON-decoded

AGENTS_URL = os.getenv("AGENTS_URL", "http://localhost:8004")

def fetch_reporter(session_id: str, consolidated_payload: dict, user_id: str = None) -> dict:
    resp = httpx.post(
        f"{AGENTS_URL}/api/reporter/generate",
        json={
            "session_id": session_id,
            "user_id": user_id,
            "consolidated_payload": consolidated_payload,
        },
        timeout=float(os.getenv("BRIDGE_REPORTER_TIMEOUT", "30.0")),
    )
    resp.raise_for_status()
    return resp.json()

def fetch_critic(session_id: str, engine_payload: dict, reporter_output: dict, user_id: str = None) -> dict:
    resp = httpx.post(
        f"{AGENTS_URL}/api/critic/audit",
        json={
            "session_id": session_id,
            "user_id": user_id,
            "engine_payload": engine_payload,
            "reporter_output": reporter_output,
        },
        timeout=float(os.getenv("BRIDGE_CRITIC_TIMEOUT", "30.0")),
    )
    resp.raise_for_status()
    return resp.json()
