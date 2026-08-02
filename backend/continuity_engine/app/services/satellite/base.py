"""Dual-source (optical + SAR) provider protocol.

Same design pattern as water_engine's SatelliteProvider and heat_engine's
ThermalDataClient — an interface + a live implementation + a synthetic
offline implementation, switched by env var. Layer 0 needs TWO sources
per fetch instead of one: cloud-affected optical (what needs repairing)
and cloud-penetrating SAR (the structural signal that makes repair
possible at all).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Protocol

import numpy as np


class ContinuityDataError(Exception):
    """Base class for Layer 0 data retrieval errors."""


class NoUsableSceneError(ContinuityDataError):
    """Raised when no optical+SAR pair can be found for the AOI/date range."""


@dataclass(slots=True)
class DualSourceBundle:
    """One optical scene + its matching SAR scene for the same AOI/date."""

    optical_bands: np.ndarray
    """Shape (C, H, W) — Sentinel-2 bands, surface reflectance [0, 1].
    May contain NaN where clouds/cloud-shadow were masked out."""

    sar_bands: np.ndarray
    """Shape (2, H, W) — Sentinel-1 VV, VH polarization, dB scale.
    Radar — not blocked by cloud cover, always fully valid."""

    cloud_mask: np.ndarray
    """Shape (H, W), bool — True where the optical scene is cloud/shadow
    affected and needs reconstruction."""

    optical_scene_id: str
    sar_scene_id: str
    capture_date: datetime
    cloud_cover_pct: float
    provider: str
    metadata: dict[str, Any]


class DualSourceProvider(Protocol):
    """Discovers and reads a matched optical+SAR pair for an AOI."""

    name: str

    def fetch(
        self,
        *,
        geometry: dict[str, Any],
        start_date: date,
        end_date: date,
    ) -> DualSourceBundle: ...
