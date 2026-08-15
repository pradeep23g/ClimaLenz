from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.thermal_defs import GuardrailStatus, InterventionType


class SimulationRequest(BaseModel):
    """Request payload for POST /v1/simulations/what-if."""

    bbox: List[float] = Field(
        default=[80.15, 12.98, 80.29, 13.11],
        min_length=4,
        max_length=4,
        description="AOI bounding box [min_lon, min_lat, max_lon, max_lat] in EPSG:4326. Defaults to Chennai.",
    )
    date_range: str = Field(
        default="2025-01-01/2026-07-31",
        description="STAC-style ISO date range 'start/end' to search for source scenes.",
    )
    intervention_type: InterventionType = Field(
        default=InterventionType.CANOPY,
        description="Which micro-climate intervention to simulate.",
    )
    delta: float = Field(
        default=0.15,
        ge=-2.0,
        le=2.0,
        description="Magnitude of the intervention bump applied for the simulation.",
    )


class GuardrailResult(BaseModel):
    """Mirrors the dict returned by app.services.physics_guardrail.physicist_agent()."""

    model_config = ConfigDict(frozen=True)

    status: GuardrailStatus
    reason: Optional[str] = None
    confidence: Optional[str] = None


class SimulationResponse(BaseModel):
    """Response payload for POST /v1/simulations/what-if."""

    model_config = ConfigDict(frozen=True)

    intervention_type: InterventionType
    delta: float
    guardrail_status: GuardrailStatus
    details: str = Field(..., description="Human-readable guardrail explanation.")
    delta_t_grid: List[List[float]] = Field(
        ..., description="(H, W) grid of simulated-minus-baseline temperature change, in Celsius."
    )
    data_provenance: str = Field(
        ..., description="Provenance of input data: 'live', 'continuity_reconstructed', or 'synthetic_fallback'."
    )
    visualization_base64: Optional[str] = Field(
        default=None, description="Optional base64-encoded PNG comparison plot."
    )
