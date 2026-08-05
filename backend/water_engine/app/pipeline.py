from __future__ import annotations

import logging
from datetime import date, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict

from app.models.telemetry import FieldTelemetry
from app.services.data_confidence import (
    ConfidenceReport,
    needs_field_verification,
    score_confidence,
)
from app.services.spectral_engine import (
    SceneSpectralSummary,
    SpectralMetrics,
    process_scene_telemetry,
)
from app.services.ecological_risk import EcologicalRiskProfile, risk_engine
from app.services.satellite.client_factory import resolve_satellite_client

logger = logging.getLogger(__name__)

# Constants for spatial domain classification
_AOI_WATER_DOMINANT_THRESHOLD = 0.50
_AOI_MIXED_DOMAIN_THRESHOLD = 0.20


class AOIDomainCategory(str, Enum):
    """Classification of Area of Interest spatial composition."""
    WATER_BODY = "water"
    MIXED_LAND_WATER = "mixed"
    TERRESTRIAL = "land"


def _classify_spatial_domain(water_fraction: float) -> AOIDomainCategory:
    """Categorizes the primary physical surface type of the queried geometry."""
    if water_fraction >= _AOI_WATER_DOMINANT_THRESHOLD:
        return AOIDomainCategory.WATER_BODY
    if water_fraction >= _AOI_MIXED_DOMAIN_THRESHOLD:
        return AOIDomainCategory.MIXED_LAND_WATER
    return AOIDomainCategory.TERRESTRIAL


class EnvironmentalPipelineReport(BaseModel):
    """
    Production-grade consolidated assessment payload returned by the Core A pipeline.
    Fully serializable Pydantic V2 schema for FastAPI endpoints and multi-agent layers.
    """
    model_config = ConfigDict(frozen=True)

    scene_identifier: str = Field(..., description="Provider catalog ID for the retrieved raster.")
    data_provider: str = Field(..., description="Gateway platform utilized for imagery retrieval.")
    capture_timestamp_utc: str = Field(..., description="ISO 8601 acquisition timestamp.")
    cloud_cover_percentage: float = Field(..., ge=0.0, le=100.0, description="Scene cloud cover %.")
    spatial_domain: AOIDomainCategory = Field(..., description="AOI surface category (water/mixed/land).")
    water_coverage_fraction: float = Field(..., ge=0.0, le=1.0, description="Ratio of valid water pixels.")
    flooded_vegetation_fraction: float = Field(
        ..., ge=0.0, le=1.0,
        description=(
            "Ratio of valid pixels flagged as saturated/inundated vegetation "
            "(Xiao LSWI-vs-NDVI test) — canopy-obscured flooding that the "
            "open-water mask cannot see. Disjoint from water_coverage_fraction."
        ),
    )
    spectral_indices: List[SpectralMetrics] = Field(..., description="Calculated band-math metrics.")
    ecological_risk: EcologicalRiskProfile = Field(..., description="Deterministic compound risk assessment.")
    data_confidence: ConfidenceReport = Field(..., description="Multi-factor reliability assessment.")
    requires_ground_truth_audit: bool = Field(..., description="Flag for field verification dispatch.")
    pipeline_warnings: List[str] = Field(default_factory=list, description="Data caveats and operational warnings.")


def execute_environmental_pipeline(
    *,
    spatial_geometry: Dict[str, Any],
    observation_lookback_days: int = 30,
    cloud_tolerance_pct: float = 30.0,
    field_telemetry_history: Optional[List[FieldTelemetry]] = None,
) -> EnvironmentalPipelineReport:
    """
    Executes the end-to-end Core A Water Engine pipeline for a specified AOI polygon.

    Workflow Sequence:
    1. Resolves active satellite gateway (Live STAC API or Synthetic Mock).
    2. Queries catalog & extracts aligned multispectral surface reflectance matrices.
    3. Calculates spectral indices over dual NDWI/MNDWI water mask via spectral_engine.
    4. Computes deterministic compound risk profile via EcologicalRisk engine.
    5. Calculates Honest AI confidence score & evaluates ground truth field dispatch.
    """
    query_end_date = date.today()
    query_start_date = query_end_date - timedelta(days=observation_lookback_days)

    # 1. Acquire Satellite Imagery Observation Context
    try:
        client = resolve_satellite_client()
        observation_context = client.retrieve_scene(
            spatial_bounds=spatial_geometry,
            search_start=query_start_date,
            search_end=query_end_date,
            max_cloud_tolerance=cloud_tolerance_pct,
        )
    except Exception as exc:
        logger.warning(f"Live satellite gateway failed ({exc}). Falling back to synthetic provider.")
        from app.services.satellite.synthetic_provider import SyntheticDualProvider
        client = SyntheticDualProvider()
        observation_context = client.retrieve_scene(
            spatial_bounds=spatial_geometry,
            search_start=query_start_date,
            search_end=query_end_date,
            max_cloud_tolerance=cloud_tolerance_pct,
        )

    # 2. Process Spectral Telemetry & Water Masking
    spectral_summary: SceneSpectralSummary = process_scene_telemetry(observation_context.data_cube)
    water_fraction = spectral_summary.water_coverage_ratio
    domain_category = _classify_spatial_domain(water_fraction)

    # 3. Spatial Domain Caveat Verification
    pipeline_warnings: List[str] = []
    if domain_category == AOIDomainCategory.TERRESTRIAL:
        pipeline_warnings.append(
            f"AOI is predominantly land (water coverage: {water_fraction:.1%}). Spectral readings reflect "
            "terrestrial vegetation/soil rather than water quality. Redraw polygon over open water."
        )
    elif domain_category == AOIDomainCategory.MIXED_LAND_WATER:
        pipeline_warnings.append(
            f"AOI contains mixed land/water pixels (water coverage: {water_fraction:.1%}). Land signal "
            "may slightly dilute aquatic spectral index precision."
        )

    # 4. Compute Deterministic Risk Assessment
    telemetry_input = field_telemetry_history or []
    risk_profile: EcologicalRiskProfile = risk_engine.generate_assessment(
        spectral_metrics=spectral_summary.metrics,
        telemetry=telemetry_input,
    )

    # 5. Evaluate Data Confidence & Field Audit Dispatch
    valid_sample_count = (
        sum(metric.pixel_count for metric in spectral_summary.metrics) // max(len(spectral_summary.metrics), 1)
    )
    confidence_assessment: ConfidenceReport = score_confidence(
        cloud_cover_pct=observation_context.cloud_fraction,
        water_fraction=water_fraction,
        sample_count=valid_sample_count,
        capture_date=observation_context.acquisition_timestamp,
    )
    
    pipeline_warnings.extend(confidence_assessment.caveats)

    field_audit_required = needs_field_verification(
        risk_level=risk_profile.tier,
        confidence=confidence_assessment,
    )

    # 6. Package Consolidated Output
    return EnvironmentalPipelineReport(
    scene_identifier=observation_context.asset_id,
    data_provider=client.gateway_name,
    capture_timestamp_utc=observation_context.acquisition_timestamp.isoformat(),
    cloud_cover_percentage=observation_context.cloud_fraction,
    spatial_domain=domain_category,
    water_coverage_fraction=water_fraction,
    flooded_vegetation_fraction=spectral_summary.flooded_vegetation_ratio,  
    spectral_indices=spectral_summary.metrics,
    ecological_risk=risk_profile,
    data_confidence=confidence_assessment,
    requires_ground_truth_audit=field_audit_required,
    pipeline_warnings=pipeline_warnings,
)