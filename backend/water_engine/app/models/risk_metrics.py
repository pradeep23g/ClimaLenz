from __future__ import annotations

from enum import IntEnum, Enum


class RiskTier(IntEnum):
    """
    Hierarchical risk assessment tiers. 
    Inherits IntEnum to allow direct mathematical comparisons (e.g., HIGH > LOW).
    """
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4  # New edge-case tier for extreme colocation overlaps

    @classmethod
    def from_confidence_score(cls, score: float) -> RiskTier:
        """Dynamically maps a normalized mathematical risk score (0.0 to 1.0) to a category."""
        if score >= 0.85:
            return cls.CRITICAL
        elif score >= 0.60:
            return cls.HIGH
        elif score >= 0.35:
            return cls.MEDIUM
        return cls.LOW

    @property
    def label(self) -> str:
        return self.name.lower()


class OperationalUrgency(str, Enum):
    """Response escalation levels for smart-city integration."""
    ROUTINE = "routine"
    ELEVATED = "elevated"
    IMMEDIATE = "immediate"
    EMERGENCY = "emergency" 

    @property
    def sla_hours(self) -> int:
        """Returns the Service Level Agreement (SLA) target response time in hours."""
        mapping = {
            self.ROUTINE: 72,
            self.ELEVATED: 24,
            self.IMMEDIATE: 4,
            self.EMERGENCY: 1,
        }
        return mapping[self]