from __future__ import annotations

from datetime import date
import shapely.geometry

from pydantic import BaseModel, Field, model_validator, field_validator


class ReconstructionRequest(BaseModel):
    geometry: dict = Field(..., description="GeoJSON Polygon for the AOI.")
    start_date: date
    end_date: date

    @model_validator(mode='after')
    def check_dates(self) -> ReconstructionRequest:
        if self.start_date > self.end_date:
            raise ValueError("start_date cannot be after end_date")
        return self

    @field_validator('geometry')
    @classmethod
    def check_geometry(cls, v: dict):
        try:
            geom = shapely.geometry.shape(v)
            if not geom.is_valid:
                raise ValueError("Provided geometry is not a valid polygon.")
        except Exception as e:
            raise ValueError(f"Invalid GeoJSON: {e}")
        return v


class ReconstructionResponse(BaseModel):
    job_id: str
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
