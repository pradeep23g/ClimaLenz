from __future__ import annotations

from datetime import date, datetime
from typing import Any, Protocol, Tuple, Optional, Dict
import numpy as np
from pydantic import BaseModel, Field, ConfigDict


class EarthObservationError(Exception):
    """Root exception for remote sensing acquisition failures."""


class CloudCoverTooHighError(EarthObservationError):
    """Raised when available scenes exceed cloud contamination limits."""


class NoUsableSceneError(EarthObservationError):
    """Raised when spatial/temporal queries yield no valid imagery."""


# Alias kept for backwards compatibility with callers (e.g. planetary_client.py)
# that reference the class under its older name.
SceneNotFoundError = NoUsableSceneError


class ReflectanceCube:
    """
    Memory-optimized container for orthorectified surface reflectance matrices.
    Uses __slots__ to prevent dictionary allocation overhead when processing
    massive satellite TIFF structures, ensuring low-latency Cloud Run execution.

    Attribute names intentionally match the `BandStack` interface consumed by
    app.services.spectral_engine (see app/services/satellite/base.py).
    """
    __slots__ = (
        "blue", "green", "red", "red_edge",
        "nir", "swir", "valid_mask", "spatial_resolution_m"
    )

    def __init__(
        self,
        blue: np.ndarray,
        green: np.ndarray,
        red: np.ndarray,
        red_edge: np.ndarray,
        nir: np.ndarray,
        swir: np.ndarray,
        valid_mask: np.ndarray,
        resolution: float = 10.0
    ):
        self.blue = blue
        self.green = green
        self.red = red
        self.red_edge = red_edge
        self.nir = nir
        self.swir = swir
        self.valid_mask = valid_mask
        self.spatial_resolution_m = resolution

    @property
    def matrix_shape(self) -> Tuple[int, int]:
        """Returns the strictly verified 2D dimensions of the clipped area."""
        return self.green.shape  # type: ignore


class ObservationContext(BaseModel):
    """
    Standardized metadata wrapper for successfully retrieved satellite imagery.
    """
    # Required to allow Pydantic to hold our custom ReflectanceCube
    model_config = ConfigDict(arbitrary_types_allowed=True)

    data_cube: ReflectanceCube = Field(..., description="The raw 2D pixel matrices.")
    asset_id: str = Field(..., description="Unique catalog identifier from the provider.")
    acquisition_timestamp: datetime = Field(..., description="Exact UTC capture time.")
    cloud_fraction: float = Field(..., ge=0.0, le=100.0, description="Scene-level cloud cover percentage.")
    source_platform: str = Field(..., description="Name of the satellite constellation (e.g., Sentinel-2).")
    preview_uri: Optional[str] = Field(default=None, description="URL to a quicklook RGB thumbnail.")
    extended_metadata: Dict[str, Any] = Field(default_factory=dict)


class EarthObservationClient(Protocol):
    """
    Interface definition for satellite data retrieval engines.
    Enforces a strict contract for fetching multi-spectral optical data.
    """
    gateway_name: str

    def retrieve_scene(
        self,
        *,
        spatial_bounds: Dict[str, Any],
        search_start: date,
        search_end: date,
        max_cloud_tolerance: float,
    ) -> ObservationContext:
        """Executes the catalog search and data extraction pipeline."""
        ...