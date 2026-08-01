from __future__ import annotations

from enum import Enum
from pydantic import BaseModel, Field, model_validator


class WaterColor(str, Enum):
    """Categorical visual water color observed in the field."""
    CLEAR = "clear"
    GREEN = "green"     # Potential algal bloom indicator
    BROWN = "brown"     # Suspended sediment / turbidity
    YELLOW = "yellow"
    BLACK = "black"     # Severe organic decay / anaerobic
    RED = "red"         # Toxic bloom (red tide) or industrial run-off

    @property
    def severity_multiplier(self) -> float:
        """Returns a weighted multiplier for downstream risk calculations."""
        mapping = {
            self.CLEAR: 1.0,
            self.YELLOW: 1.2,
            self.BROWN: 1.5,
            self.GREEN: 1.8,
            self.RED: 2.5,
            self.BLACK: 3.0,
        }
        return mapping.get(self, 1.0)


class OdorProfile(str, Enum):
    """Olfactory characteristics of the water body."""
    NONE = "none"
    FISHY = "fishy"
    ROTTEN = "rotten"
    CHEMICAL = "chemical"
    SEWAGE = "sewage"
    MUSTY = "musty"
    
    @property
    def requires_testing(self) -> bool:
        """Flags odors that mandate immediate biochemical testing."""
        return self in {self.CHEMICAL, self.SEWAGE, self.ROTTEN}


class FieldTelemetry(BaseModel):
    """
    Production-grade validation schema for field observations.
    Fully backward-compatible with legacy risk scoring pipelines.
    """
    water_color: WaterColor = Field(default=WaterColor.CLEAR, description="Observed visual color.")
    odor: OdorProfile = Field(default=OdorProfile.NONE, description="Dominant odor profile.")
    algae_present: bool = Field(default=False, description="Binary flag for visible algal blooms.")
    
    # Strict validation: Counts and rainfall cannot physically be negative
    dead_fish_count: int = Field(default=0, ge=0, description="Count of deceased aquatic life.")
    complaints_count: int = Field(default=0, ge=0, description="Number of registered citizen complaints.")
    rainfall_mm: float = Field(default=0.0, ge=0.0, description="Recent precipitation in millimeters.")

    # New expansion fields (optional, won't break old logic)
    surface_temp_c: float | None = Field(default=None, description="In-situ surface temperature.")
    ph_level: float | None = Field(default=None, ge=0.0, le=14.0, description="Measured pH level.")

    @model_validator(mode="after")
    def compute_composite_risk(self) -> FieldTelemetry:
        """Internal validation hook for compounding environmental risks."""
        if self.dead_fish_count > 10 and self.odor.requires_testing:
            # Future expansion: Automatically trigger high-alert flags here
            pass
        return self

    @property
    def is_critical_event(self) -> bool:
        """Determines if the telemetry warrants an immediate emergency alert."""
        return self.dead_fish_count > 5 or self.water_color in {WaterColor.BLACK, WaterColor.RED}