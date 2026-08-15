from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, model_validator


class CoLocationRequest(BaseModel):
    """Input to a combined water+heat assessment for one AOI.

    The caller provides ONE canonical AOI as ``spatial_geometry`` (GeoJSON
    Polygon).  ``bbox`` is derived automatically from the geometry's
    coordinate bounds when not explicitly supplied.  Callers that still
    pass both fields are fully backward-compatible.
    """

    spatial_geometry: dict
    """GeoJSON Polygon — passed straight through to the water engine."""

    bbox: Optional[list[float]] = None
    """[min_lon, min_lat, max_lon, max_lat] in EPSG:4326.  Derived from
    spatial_geometry when omitted."""

    @model_validator(mode="after")
    def _derive_bbox(self) -> "CoLocationRequest":
        """Compute bbox from the GeoJSON Polygon when the caller omits it."""
        if self.bbox is not None:
            return self  # caller supplied an explicit bbox — trust it

        geom_type = self.spatial_geometry.get("type")
        if geom_type != "Polygon":
            raise ValueError(
                f"spatial_geometry must be a GeoJSON Polygon, got '{geom_type}'. "
                "Point, LineString, and other types are not supported."
            )

        coords = self.spatial_geometry.get("coordinates")
        if not coords or not coords[0]:
            raise ValueError(
                "Cannot derive bbox: spatial_geometry must be a GeoJSON "
                "Polygon with at least one non-empty coordinate ring."
            )

        ring = coords[0]  # outer ring
        lons = [pt[0] for pt in ring]
        lats = [pt[1] for pt in ring]
        self.bbox = [
            min(lons),  # min_lon
            min(lats),  # min_lat
            max(lons),  # max_lon
            max(lats),  # max_lat
        ]
        return self

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

