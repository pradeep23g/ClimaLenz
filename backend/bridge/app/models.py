from __future__ import annotations

from pydantic import BaseModel


class CoLocationRequest(BaseModel):
    """Input to a combined water+heat assessment for one AOI."""

    spatial_geometry: dict
    """GeoJSON Polygon — passed straight through to the water engine."""

    bbox: list[float]
    """[minx, miny, maxx, maxy] — passed straight through to the heat engine."""

    intervention_type: str = "CANOPY"
    delta: float = 0.15
    """Kept modest by default — see physics_guardrail.py's literature-backed
    bounds (4.0/3.0/5.0°C). A mild default demonstrates the PASSED path;
    override with a larger delta to demonstrate FLAGGED."""

    cloud_tolerance_pct: float = 30.0
    """Allows the caller to increase cloud tolerance to trigger the Continuity Engine repair."""


class StageTimings(BaseModel):
    water_engine_s: float
    heat_engine_s: float
    total_s: float


class CoLocationReport(BaseModel):
    """Combined output — the thing ClimaLenz's whole pitch is actually about."""

    triggered: bool
    """True when water risk and a physically-valid heat reading co-occur."""

    water_score: float
    water_tier: str
    water_confidence_band: str | None
    heat_guardrail_status: str
    heat_intervention_type: str
    heat_delta_summary: dict[str, float]
    """min/max/mean of the delta_T grid — a full 64x64 grid isn't useful in
    a one-line flag; the raw grid is still available from the heat engine
    directly if the frontend needs to render it."""

    narrative: str
    """Template-generated for now — see co_location.py docstring for why
    this is deliberately NOT an LLM call yet."""

    stage_timings: StageTimings

