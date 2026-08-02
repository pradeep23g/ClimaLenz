from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class ReconstructionRequest(BaseModel):
    geometry: dict = Field(..., description="GeoJSON Polygon for the AOI.")
    start_date: date
    end_date: date


class ReconstructionResponse(BaseModel):
    optical_scene_id: str
    sar_scene_id: str
    provider: str
    capture_date: str
    original_cloud_cover_pct: float

    scene_confidence: float
    reconstructed_fraction: float
    low_confidence_fraction: float
    caveats: list[str]

    reconstructed_bands_shape: list[int]
    """(C, H, W) — the actual reconstructed array is large; expose shape
    here and let callers fetch the full array via a separate raster
    endpoint or shared storage, same as how heat_engine keeps its full
    delta_t_grid out of the summary-level response."""
