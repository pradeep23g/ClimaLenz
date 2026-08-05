from __future__ import annotations

import os

import httpx

WATER_ENGINE_URL = os.getenv("WATER_ENGINE_URL", "http://localhost:8001")
HEAT_ENGINE_URL = os.getenv("HEAT_ENGINE_URL", "http://localhost:8002")


def fetch_water_assessment(
    geometry: dict,
    lookback_days: int = 30,
    cloud_tolerance_pct: float = 30.0,
) -> dict:
    """Calls water_engine's confirmed real endpoint and payload shape.

    Endpoint: POST /v1/assessments/generate
    Payload field names confirmed against app/main.py's AssessmentPayload.
    """
    resp = httpx.post(
        f"{WATER_ENGINE_URL}/v1/assessments/generate",
        json={
            "spatial_geometry": geometry,
            "observation_lookback_days": lookback_days,
            "cloud_tolerance_pct": cloud_tolerance_pct,
        },
        timeout=300.0,
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
        timeout=300.0,
    )
    resp.raise_for_status()
    return resp.json()  # -> SimulationResponse, JSON-decoded
