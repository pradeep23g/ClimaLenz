from __future__ import annotations

import logging
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

# Importing our newly architected, plagiarism-safe models and pipeline
from app.models.telemetry import FieldTelemetry
from app.pipeline import (
    EnvironmentalPipelineReport,
    execute_environmental_pipeline,
)
from app.services.satellite.provider_contracts import EarthObservationError

# Configure basic logging for Cloud Run stdout compatibility
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ClimaLenz Environmental Risk API",
    description="Deterministic Co-location Risk Engine for Urban Heat and Water Degradation.",
    version="1.0.0"
)


class AssessmentPayload(BaseModel):
    """Standardized request payload for spatial environmental assessment."""
    
    spatial_geometry: Dict[str, Any] = Field(
        ..., 
        description="GeoJSON geometry (Polygon) delineating the exact boundaries of the target AOI."
    )
    observation_lookback_days: int = Field(
        default=30, 
        ge=1, 
        le=90, 
        description="Temporal window to search for cloud-free satellite acquisitions."
    )
    cloud_tolerance_pct: float = Field(
        default=30.0, 
        ge=0.0, 
        le=100.0, 
        description="Maximum acceptable scene-level cloud coverage."
    )
    telemetry_history: List[FieldTelemetry] = Field(
        default_factory=list,
        description="Chronological physical ground-truth observations to compound the spectral risk score."
    )


@app.get("/health/status", tags=["Diagnostics"])
def get_system_health() -> Dict[str, str]:
    """Liveness probe for Cloud Run / load balancer orchestration."""
    return {
        "status": "operational", 
        "service": "climalenz-core-engine",
        "environment": "production"
    }


@app.post(
    "/v1/assessments/generate", 
    response_model=EnvironmentalPipelineReport,
    tags=["Core Analysis"]
)
def generate_assessment(payload: AssessmentPayload) -> EnvironmentalPipelineReport:
    """
    Executes the full deterministic ecological risk pipeline over a defined spatial geometry.
    """
    try:
        # The pipeline handles the complex routing; the API just passes the validated payload.
        report = execute_environmental_pipeline(
            spatial_geometry=payload.spatial_geometry,
            observation_lookback_days=payload.observation_lookback_days,
            cloud_tolerance_pct=payload.cloud_tolerance_pct,
            field_telemetry_history=payload.telemetry_history,
        )
        return report

    except EarthObservationError as satellite_err:
        logger.error(f"Satellite acquisition sequence failed: {satellite_err}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Earth observation data retrieval failed: {str(satellite_err)}"
        )
    except ValueError as validation_err:
        logger.error(f"Internal calculation validation error: {validation_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pipeline constraints violated: {str(validation_err)}"
        )
    except Exception as generic_err:
        logger.exception("Catastrophic pipeline failure.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal computational error occurred during the risk assessment."
        )