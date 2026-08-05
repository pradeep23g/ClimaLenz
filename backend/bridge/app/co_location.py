"""Co-location logic — combines water_engine + heat_engine outputs.

Deliberately NOT an LLM call. See the project's own "Honest AI" principle:
AI is only used to narrate numbers that deterministic/physics-checked
engines already computed — never to decide the flag itself. The trigger
condition below is a plain threshold comparison specifically because
that's auditable and can't hallucinate; swap the `_build_narrative`
function for a Gemini call later without touching this logic at all.
"""

from __future__ import annotations

from statistics import mean

# GuardrailStatus is a (str, Enum) with exactly two members per the
# confirmed thermal_defs.py: "PASSED" / "FLAGGED". Comparing against the
# raw string values here (not importing the enum) keeps this module
# import-independent from heat_engine's package — the bridge talks to
# both engines over HTTP, not via shared Python imports, so it shouldn't
# need either engine installed as a library.
GUARDRAIL_PASSED = "PASSED"
GUARDRAIL_FLAGGED = "FLAGGED"

WATER_RISK_TRIGGER = 0.5
"""Tune this once you have real AOI runs to calibrate against — 0.5 is a
reasonable midpoint given aggregate_score's confirmed 0.0-1.0 range and
ecological_risk.py's own tier bucketing, but it's a placeholder until
tested against actual water bodies, not a literature-derived number like
the heat guardrail's bounds are."""


def _delta_t_summary(delta_t_grid: list[list[float]]) -> dict[str, float]:
    """Collapse the (H, W) grid to min/max/mean — enough for a one-line
    flag; callers who need the full spatial grid should fetch it directly
    from heat_engine's response rather than through this summary."""
    flat = [v for row in delta_t_grid for v in row]
    if not flat:
        return {"min": 0.0, "max": 0.0, "mean": 0.0}
    return {"min": min(flat), "max": max(flat), "mean": mean(flat)}


def _build_narrative(
    *,
    triggered: bool,
    water_tier: str,
    water_score: float,
    guardrail_status: str,
    delta_summary: dict[str, float],
) -> str:
    if not triggered:
        return (
            f"Water risk ({water_tier}, score {water_score:.2f}) is below the "
            f"co-location trigger threshold ({WATER_RISK_TRIGGER}). No combined "
            f"flag raised for this AOI."
        )

    confidence_note = (
        "a physically validated"
        if guardrail_status == GUARDRAIL_PASSED
        else "a flagged, low-confidence"
    )

    return (
        f"This zone shows {water_tier} water risk (score {water_score:.2f}) "
        f"co-located with {confidence_note} heat simulation "
        f"(mean predicted \u0394T {delta_summary['mean']:+.2f}\u00b0C, "
        f"range {delta_summary['min']:+.2f} to {delta_summary['max']:+.2f}\u00b0C). "
        f"This is a flagged HYPOTHESIS, not a proven causal link \u2014 "
        f"recommend field verification before it informs any funding or "
        f"intervention decision."
    )


def evaluate_colocation(water_report: dict, heat_result: dict) -> dict:
    """Combine one water_engine report + one heat_engine result.

    water_report: JSON-decoded EnvironmentalPipelineReport (dict, from
        response.json() — score/tier are nested under "ecological_risk").
    heat_result: JSON-decoded SimulationResponse (dict).
    """
    ecological_risk = water_report["ecological_risk"]
    water_score = ecological_risk["aggregate_score"]
    water_tier = ecological_risk["tier"]
    
    tier_map = {1: "LOW", 2: "MEDIUM", 3: "HIGH", 4: "CRITICAL"}
    water_tier_name = tier_map.get(water_tier, str(water_tier))
    
    confidence = water_report.get("data_confidence") or {}
    confidence_band = confidence.get("band")

    guardrail_status = heat_result["guardrail_status"]
    delta_summary = _delta_t_summary(heat_result["delta_t_grid"])

    triggered = water_score >= WATER_RISK_TRIGGER

    narrative = _build_narrative(
        triggered=triggered,
        water_tier=water_tier_name,
        water_score=water_score,
        guardrail_status=guardrail_status,
        delta_summary=delta_summary,
    )

    return {
        "triggered": triggered,
        "water_score": water_score,
        "water_tier": water_tier_name,
        "water_confidence_band": confidence_band,
        "heat_guardrail_status": guardrail_status,
        "heat_intervention_type": heat_result["intervention_type"],
        "heat_delta_summary": delta_summary,
        "narrative": narrative,
    }
