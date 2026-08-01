from __future__ import annotations

from typing import Sequence, Dict, Tuple
from pydantic import BaseModel, Field, ConfigDict

# Importing the upgraded 10/10 models from our previous refactors
from app.models.telemetry import FieldTelemetry
from app.models.risk_metrics import RiskTier, OperationalUrgency
from app.models.spectral_defs import SpectralSignature
from app.services.spectral_engine import SpectralMetrics


class RiskWeightsConfig(BaseModel):
    """
    Centralized configuration for spectral and telemetry risk multipliers.
    Prevents hardcoded global dictionaries and allows dynamic reconfiguration.
    """
    model_config = ConfigDict(frozen=True)

    # Spectral Base Weights
    chlorophyll_ndci: float = 0.40
    turbidity_ndti: float = 0.25
    vegetation_ndvi: float = 0.10
    water_loss_mndwi: float = 0.10
    water_loss_ndwi: float = 0.15

    # Telemetry Modifiers & Caps
    algae_penalty: float = 0.20
    color_anomaly: float = 0.10
    odor_anomaly: float = 0.10
    
    fish_kill_rate: float = 0.05
    fish_kill_cap: float = 0.20
    
    complaint_rate: float = 0.04
    complaint_cap: float = 0.12
    
    rainfall_rate: float = 0.03  # Per 10mm
    rainfall_cap: float = 0.10


class EcologicalRiskProfile(BaseModel):
    """
    The final deterministic risk assessment payload.
    """
    aggregate_score: float = Field(ge=0.0, le=1.0)
    tier: RiskTier
    escalation: OperationalUrgency
    spectral_baseline: float
    telemetry_modifier: float
    breakdown: Dict[str, float]


def _scale_value(val: float, floor: float, ceiling: float) -> float:
    """Linearly maps a value to a 0.0 - 1.0 boundary."""
    if ceiling <= floor:
        return 0.0
    mapped = (val - floor) / (ceiling - floor)
    return max(0.0, min(1.0, mapped))


class RiskEngine:
    """
    Deterministic evaluation engine for compounding environmental risks.
    No LLMs, no hallucinations—strictly bounded mathematical scoring.
    """

    def __init__(self, config: RiskWeightsConfig | None = None):
        self.config = config or RiskWeightsConfig()

    def _evaluate_spectral_baseline(self, metrics: Sequence[SpectralMetrics]) -> Tuple[float, Dict[str, float]]:
        """Calculates the physical risk floor based strictly on satellite pixel data."""
        metrics_map = {m.signature: m.mean_val for m in metrics}
        factors: Dict[str, float] = {}

        # 1. Water Quality Indicators (Direct scaling)
        ndci_val = metrics_map.get(SpectralSignature.NDCI, 0.0)
        factors["spectral_ndci"] = self.config.chlorophyll_ndci * _scale_value(ndci_val, -0.1, 0.5)

        ndti_val = metrics_map.get(SpectralSignature.NDTI, 0.0)
        factors["spectral_ndti"] = self.config.turbidity_ndti * _scale_value(ndti_val, -0.2, 0.6)

        ndvi_val = metrics_map.get(SpectralSignature.NDVI, 0.0)
        factors["spectral_ndvi"] = self.config.vegetation_ndvi * _scale_value(ndvi_val, 0.0, 0.6)

        # 2. Water Loss/Drying Indicators (Inverted scaling - lower water presence = higher risk)
        mndwi_val = metrics_map.get(SpectralSignature.MNDWI, 0.0)
        factors["spectral_mndwi_loss"] = self.config.water_loss_mndwi * (1.0 - _scale_value(mndwi_val, 0.0, 0.5))

        ndwi_val = metrics_map.get(SpectralSignature.NDWI, 0.0)
        factors["spectral_ndwi_loss"] = self.config.water_loss_ndwi * (1.0 - _scale_value(ndwi_val, 0.0, 0.5))

        baseline_sum = sum(factors.values())
        return baseline_sum, factors

    def _compute_telemetry_modifier(self, telemetry_history: Sequence[FieldTelemetry]) -> Tuple[float, Dict[str, float]]:
        """Calculates risk amplification based on in-situ physical observations."""
        if not telemetry_history:
            return 0.0, {}

        latest = telemetry_history[0]
        factors: Dict[str, float] = {}

        if latest.algae_present:
            factors["telemetry_algae"] = self.config.algae_penalty

        # Utilizing the embedded intelligence we built into the Enums in telemetry.py
        if latest.water_color.severity_multiplier > 1.0:
            factors["telemetry_color"] = self.config.color_anomaly

        if latest.odor.requires_testing:
            factors["telemetry_odor"] = self.config.odor_anomaly

        if latest.dead_fish_count > 0:
            factors["telemetry_fish_kills"] = min(
                self.config.fish_kill_rate * latest.dead_fish_count, 
                self.config.fish_kill_cap
            )

        if latest.complaints_count > 0:
            factors["telemetry_complaints"] = min(
                self.config.complaint_rate * latest.complaints_count, 
                self.config.complaint_cap
            )

        if latest.rainfall_mm > 0:
            factors["telemetry_runoff_risk"] = min(
                self.config.rainfall_rate * (latest.rainfall_mm / 10.0), 
                self.config.rainfall_cap
            )

        # Hard cap the maximum telemetry amplification to +0.50
        modifier = min(sum(factors.values()), 0.5)
        return modifier, factors

    def _resolve_escalation(self, tier: RiskTier, latest_telemetry: FieldTelemetry | None) -> OperationalUrgency:
        """Determines response SLA based on systemic risk combined with physical distress."""
        has_critical_field_event = latest_telemetry.is_critical_event if latest_telemetry else False

        if tier in {RiskTier.CRITICAL, RiskTier.HIGH}:
            return OperationalUrgency.IMMEDIATE if has_critical_field_event else OperationalUrgency.ELEVATED
        
        if tier == RiskTier.MEDIUM:
            return OperationalUrgency.ELEVATED if has_critical_field_event else OperationalUrgency.ROUTINE
            
        return OperationalUrgency.ELEVATED if has_critical_field_event else OperationalUrgency.ROUTINE

    def generate_assessment(
        self, 
        spectral_metrics: Sequence[SpectralMetrics], 
        telemetry: Sequence[FieldTelemetry] = ()
    ) -> EcologicalRiskProfile:
        """
        Executes the dual-core deterministic risk algorithm.
        """
        baseline_score, spectral_breakdown = self._evaluate_spectral_baseline(spectral_metrics)
        modifier_score, telemetry_breakdown = self._compute_telemetry_modifier(telemetry)

        # Bounded compound risk (0.0 to 1.0)
        final_score = max(0.0, min(1.0, baseline_score + modifier_score))
        
        # Rely on the dynamic RiskTier mapping we built previously
        resolved_tier = RiskTier.from_confidence_score(final_score)
        
        latest_telem = telemetry[0] if telemetry else None
        escalation_sla = self._resolve_escalation(resolved_tier, latest_telem)

        # Merge diagnostics
        diagnostics = {**spectral_breakdown, **telemetry_breakdown}

        return EcologicalRiskProfile(
            aggregate_score=final_score,
            tier=resolved_tier,
            escalation=escalation_sla,
            spectral_baseline=baseline_score,
            telemetry_modifier=modifier_score,
            breakdown=diagnostics
        )

# Instantiate a global singleton for easy API import
risk_engine = RiskEngine()