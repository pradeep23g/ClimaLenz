from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class ConfidenceTier(str, Enum):
    """
    Qualitative reliability buckets for satellite-derived environmental telemetry.
    """
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

    @property
    def is_reliable(self) -> bool:
        """Indicates if the telemetry confidence is sufficient for direct policy modeling."""
        return self == ConfidenceTier.HIGH

    @property
    def requires_audit(self) -> bool:
        """Flags if the data requires human or secondary source validation."""
        return self in {ConfidenceTier.MEDIUM, ConfidenceTier.LOW}


class ConfidenceReport(BaseModel):
    """
    Production schema encapsulating data reliability metrics and field caveats.
    """
    score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Normalized aggregate trust score between 0.0 (unusable) and 1.0 (pristine)."
    )
    band: ConfidenceTier = Field(
        ...,
        description="Qualitative confidence categorization."
    )
    contributors: Dict[str, float] = Field(
        default_factory=dict,
        description="Individual normalized score contributions per telemetry factor."
    )
    caveats: List[str] = Field(
        default_factory=list,
        description="Explicit human-readable warnings regarding potential data degradation."
    )

    @field_validator("score", mode="after")
    def validate_score_precision(cls, value: float) -> float:
        """Rounds score precision to 4 decimal places for clean API serialization."""
        return round(value, 4)

    @property
    def has_critical_caveats(self) -> bool:
        """Determines if any registered caveat indicates severe data degradation."""
        return self.band == ConfidenceTier.LOW or len(self.caveats) >= 3


class ConfidenceWeights(BaseModel):
    """
    Configurable factor weightings for computing overall confidence scores.
    """
    cloud_cover: float = Field(default=0.35, ge=0.0, le=1.0)
    water_signal: float = Field(default=0.35, ge=0.0, le=1.0)
    freshness: float = Field(default=0.30, ge=0.0, le=1.0)

    @field_validator("freshness", mode="after")
    def validate_sum(cls, v: float, info) -> float:
        """Ensures contributor weights sum to 1.0."""
        values = info.data
        total = values.get("cloud_cover", 0.0) + values.get("water_signal", 0.0) + v
        if not (0.99 <= total <= 1.01):
            raise ValueError(f"Confidence factor weights must sum to 1.0, got {total:.2f}")
        return v


def _min_max_scale(value: float, low: float, high: float) -> float:
    """Scales and clamps a numeric input linearly into a bounded [0.0, 1.0] interval."""
    if high <= low:
        return 0.0
    scaled = (value - low) / (high - low)
    return max(0.0, min(1.0, scaled))


def _resolve_tier(score: float) -> ConfidenceTier:
    """Categorizes a normalized confidence score into its corresponding tier."""
    if score >= 0.70:
        return ConfidenceTier.HIGH
    elif score >= 0.40:
        return ConfidenceTier.MEDIUM
    return ConfidenceTier.LOW


def score_confidence(
    *,
    cloud_cover_pct: float,
    water_fraction: float,
    sample_count: int,
    capture_date: datetime,
    as_of: Optional[datetime] = None,
    max_useful_age_days: float = 14.0,
    weights: Optional[ConfidenceWeights] = None,
) -> ConfidenceReport:
    """
    Computes an honest, multi-factor confidence assessment for satellite observation scenes.

    Calculates three decoupled telemetry quality indicators:
    1. Cloud Cover Degradation: Evaluates atmospheric contamination risks (0–40% threshold).
    2. Water Signal Strength: Assesses statistical sample size and spatial pixel coverage.
    3. Temporal Freshness: Penalizes scene staleness relative to standard observation windows.

    Returns a ConfidenceReport instance. Does NOT mutate raw physical risk calculations.
    """
    active_weights = weights or ConfidenceWeights()
    contributors: Dict[str, float] = {}
    caveats: List[str] = []

    # --- 1. Cloud Cover Assessment ---
    # 0% cloud = 1.0 confidence, >=40% cloud = 0.0 confidence
    cloud_score = 1.0 - _min_max_scale(cloud_cover_pct, 0.0, 40.0)
    contributors["cloud_cover"] = round(cloud_score, 4)

    if cloud_cover_pct >= 20.0:
        caveats.append(
            f"Scene cloud cover was {cloud_cover_pct:.1f}% — potential sub-pixel cloud contamination "
            "may affect spectral reflectance calculations."
        )

    # --- 2. Water Signal Quality Assessment ---
    fraction_score = _min_max_scale(water_fraction, 0.0, 0.5)
    sample_score = _min_max_scale(float(sample_count), 0.0, 200.0)
    water_signal_score = (fraction_score + sample_score) / 2.0
    contributors["water_signal_strength"] = round(water_signal_score, 4)

    if water_fraction < 0.20:
        caveats.append(
            f"Limited water coverage ({water_fraction:.1%}) within AOI — spectral indices rely on "
            "a small, potentially unrepresentative spatial sample."
        )
    if sample_count < 30:
        caveats.append(
            f"Low valid sample size ({sample_count} pixels) — statistical variance in spectral output is elevated."
        )

    # --- 3. Temporal Freshness Assessment ---
    reference_time = as_of or datetime.now(timezone.utc)
    capture_time = capture_date if capture_date.tzinfo else capture_date.replace(tzinfo=timezone.utc)
    
    elapsed_seconds = max(0.0, (reference_time - capture_time).total_seconds())
    age_days = elapsed_seconds / 86400.0
    
    freshness_score = 1.0 - _min_max_scale(age_days, 0.0, max_useful_age_days)
    contributors["scene_freshness"] = round(freshness_score, 4)

    if age_days > max_useful_age_days:
        caveats.append(
            f"Observation scene age is {age_days:.1f} days (exceeds {max_useful_age_days:.0f}-day target) — "
            "ground conditions may have diverged."
        )

    # --- Aggregate Weighted Confidence ---
    overall_score = (
        (contributors["cloud_cover"] * active_weights.cloud_cover) +
        (contributors["water_signal_strength"] * active_weights.water_signal) +
        (contributors["scene_freshness"] * active_weights.freshness)
    )
    overall_score = max(0.0, min(1.0, overall_score))

    return ConfidenceReport(
        score=overall_score,
        band=_resolve_tier(overall_score),
        contributors=contributors,
        caveats=caveats,
    )


def needs_field_verification(risk_level: str | Enum, confidence: ConfidenceReport) -> bool:
    """
    Determines if an observation requires ground-truth validation by field officers.

    Triggers human dispatch under two critical edge cases:
    1. Overall data confidence is LOW (regardless of risk score).
    2. Risk score is HIGH/CRITICAL while data confidence is only MEDIUM.
    """
    # Normalize risk input to lower string representation
    if isinstance(risk_level, Enum):
        norm_risk = str(risk_level.value).lower()
    else:
        norm_risk = str(risk_level).lower()

    if confidence.band == ConfidenceTier.LOW:
        return True

    if norm_risk in {"high", "critical", "3", "4"} and confidence.band == ConfidenceTier.MEDIUM:
        return True

    return False