from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from .database import log_agent_trace

load_dotenv()


# Point Google Cloud Auth directly to your untracked service account key
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/home/dharshansri2007/lenz/backend/gcp-key.json"

CRITIC_MODEL = os.getenv("GEMINI_CRITIC_MODEL", "gemini-2.5-flash")
CRITIC_ENABLE_LLM_AUDIT = os.getenv("CRITIC_ENABLE_LLM_AUDIT", "true").lower() == "true"

# Initialize the unified SDK client in Vertex AI mode
_client = genai.Client(
    vertexai=True,
    project="lenz-500509",
    location="us-central1"
)
# ------------------------------------


# ---------------------------
# Schemas
# ---------------------------

class CriticInput(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    engine_payload: Dict[str, Any] = Field(
        ..., description="Deterministic outputs from heat/water/continuity/colocation/historian"
    )
    reporter_output: Dict[str, Any] = Field(
        ..., description="Structured narrative JSON from reporter.py"
    )
    copilot_output: Optional[Dict[str, Any]] = Field(
        default=None, description="Optional copilot response/tool results to validate"
    )


class UnsupportedClaim(BaseModel):
    claim_text: str
    reason: str
    severity: str  # INFO/WARN/ERROR


class Contradiction(BaseModel):
    field_or_claim: str
    expected_from_engine: str
    found_in_narrative: str
    severity: str  # WARN/ERROR


class LayerCheck(BaseModel):
    layer_name: str
    status: str  # PASS/WARN/FAIL
    notes: List[str]


class CriticOutput(BaseModel):
    generated_at: str
    summary: str
    faithfulness_score: float  # 0-100
    verdict: str  # PASS/WARN/FAIL
    contradictions: List[Contradiction]
    unsupported_claims: List[UnsupportedClaim]
    layer_checks: List[LayerCheck]
    recommendations: List[str]
    llm_audit_used: bool
    llm_audit_notes: Optional[str] = None


# ---------------------------
# Helpers
# ---------------------------

_NUMBER_RE = re.compile(r"(?<!\w)(-?\d+(?:\.\d+)?)(?!\w)")


def _flatten_dict(d: Dict[str, Any], prefix: str = "") -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for k, v in d.items():
        key = f"{prefix}.{k}" if prefix else str(k)
        if isinstance(v, dict):
            out.update(_flatten_dict(v, key))
        else:
            out[key] = v
    return out


def _extract_numbers(text: str) -> List[float]:
    nums = []
    for m in _NUMBER_RE.findall(text or ""):
        try:
            nums.append(float(m))
        except ValueError:
            continue
    return nums


def _all_engine_numbers(engine_payload: Dict[str, Any]) -> List[float]:
    nums: List[float] = []

    def walk(x: Any) -> None:
        if isinstance(x, dict):
            for v in x.values():
                walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)
        elif isinstance(x, (int, float)) and not isinstance(x, bool):
            nums.append(float(x))

    walk(engine_payload)
    # dedupe while keeping precision-ish
    dedup = list({round(n, 6) for n in nums})
    return dedup


_RISK_LEVELS = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}

# water_engine's RiskTier is an IntEnum (see backend/water_engine/app/models/risk_metrics.py)
# and serializes as an int, not a string, so a plain string-key/string-value
# lookup never matches it. Map 1-4 back onto the same LOW/MEDIUM/HIGH/CRITICAL
# vocabulary the reporter is expected to use.
_INT_TIER_MAP = {1: "LOW", 2: "MEDIUM", 3: "HIGH", 4: "CRITICAL"}


def _find_risk_level(engine_payload: Dict[str, Any]) -> Optional[str]:
    flat = _flatten_dict(engine_payload)
    # "tier" covers water_engine's ecological_risk.tier; the others are kept
    # for forward-compat with other engines/consolidators using that naming.
    candidates = ["risk_level", "overall_risk", "risk.band", "risk.level", "tier"]
    for key, value in flat.items():
        lk = key.lower()
        if not any(c in lk for c in candidates):
            continue
        if isinstance(value, str):
            v = value.strip().upper()
            if v in _RISK_LEVELS:
                return v
        elif isinstance(value, int) and not isinstance(value, bool):
            mapped = _INT_TIER_MAP.get(value)
            if mapped:
                return mapped
    return None


def _deterministic_checks(
    engine_payload: Dict[str, Any],
    reporter_output: Dict[str, Any],
    copilot_output: Optional[Dict[str, Any]],
) -> Tuple[List[Contradiction], List[UnsupportedClaim], List[LayerCheck], List[str]]:
    contradictions: List[Contradiction] = []
    unsupported: List[UnsupportedClaim] = []
    layer_checks: List[LayerCheck] = []
    recs: List[str] = []

    # ----- Reporter checks -----
    rep_status = "PASS"
    rep_notes: List[str] = []

    required = [
        "executive_summary",
        "key_findings",
        "risk_level",
        "recommended_interventions",
        "limitations_disclaimer",
    ]
    missing = [k for k in required if k not in reporter_output]
    if missing:
        rep_status = "FAIL"
        rep_notes.append(f"Missing reporter fields: {missing}")

    # Risk level consistency
    expected_risk = _find_risk_level(engine_payload)
    narrative_risk = str(reporter_output.get("risk_level", "")).upper()
    if expected_risk and narrative_risk and expected_risk != narrative_risk:
        contradictions.append(
            Contradiction(
                field_or_claim="risk_level",
                expected_from_engine=expected_risk,
                found_in_narrative=narrative_risk,
                severity="ERROR",
            )
        )
        rep_status = "WARN"
        rep_notes.append("Reporter risk_level differs from engine-derived risk_level.")

    # Numeric faithfulness: numbers mentioned in narrative should exist in engine payload
    narrative_blob = " ".join(
        [
            str(reporter_output.get("executive_summary", "")),
            " ".join(reporter_output.get("key_findings", []) or []),
            " ".join(reporter_output.get("recommended_interventions", []) or []),
        ]
    )
    narrative_nums = _extract_numbers(narrative_blob)
    engine_nums = _all_engine_numbers(engine_payload)

    # tolerant match: exact rounded match at 2dp
    engine_2dp = {round(x, 2) for x in engine_nums}
    for n in narrative_nums:
        if round(n, 2) not in engine_2dp:
            unsupported.append(
                UnsupportedClaim(
                    claim_text=f"Numeric value {n}",
                    reason="Value appears in narrative but not found in deterministic engine payload.",
                    severity="WARN",
                )
            )

    if unsupported:
        rep_notes.append("Narrative contains unsupported numeric references.")
        if rep_status == "PASS":
            rep_status = "WARN"

    layer_checks.append(LayerCheck(layer_name="reporter", status=rep_status, notes=rep_notes))

    # ----- Historian checks (if present) -----
    hist_status = "PASS"
    hist_notes: List[str] = []
    historian = engine_payload.get("historian") or engine_payload.get("historical_grounding")
    if historian:
        srcs = historian.get("sources") if isinstance(historian, dict) else None
        if srcs is not None and isinstance(srcs, list):
            bad = [s for s in srcs if not isinstance(s, dict) or not s.get("url")]
            if bad:
                hist_status = "WARN"
                hist_notes.append("Historian has source entries missing URL.")
        else:
            hist_status = "WARN"
            hist_notes.append("Historian grounding sources missing or malformed.")
    else:
        hist_status = "WARN"
        hist_notes.append("No historian grounding found in engine payload.")

    layer_checks.append(LayerCheck(layer_name="historian", status=hist_status, notes=hist_notes))

    # ----- Copilot checks (if provided) -----
    cp_status = "PASS"
    cp_notes: List[str] = []
    if copilot_output is not None:
        tool_results = copilot_output.get("tool_results", [])
        if not isinstance(tool_results, list):
            cp_status = "FAIL"
            cp_notes.append("copilot_output.tool_results is not a list.")
        else:
            allowed_tools = {
                "run_heat_what_if",
                "assess_water_risk",
                "get_continuity_repair",
                "get_colocation_assessment",
            }
            for tr in tool_results:
                tname = tr.get("tool")
                if tname not in allowed_tools:
                    cp_status = "WARN"
                    cp_notes.append(f"Unexpected tool used: {tname}")
                if "result" not in tr:
                    cp_status = "WARN"
                    cp_notes.append(f"Tool missing result payload: {tname}")
    else:
        cp_notes.append("No copilot output provided for validation.")
        cp_status = "WARN"

    layer_checks.append(LayerCheck(layer_name="copilot", status=cp_status, notes=cp_notes))

    # ----- Core deterministic payload checks -----
    # NOTE: no service in this repo currently assembles a consolidated
    # payload with these top-level keys — heat_engine, water_engine,
    # continuity_engine, and the bridge (colocation) service each return
    # their own independent response shape. Until an orchestrator/consolidator
    # exists to merge them under these names, this check will realistically
    # always WARN for real traffic; keeping it as a visible WARN (not FAIL)
    # is intentional so it surfaces the gap without blocking the pipeline.
    core_status = "PASS"
    core_notes: List[str] = []
    expected_blocks = ["heat", "water", "continuity", "colocation"]
    missing_blocks = [b for b in expected_blocks if b not in engine_payload]
    if missing_blocks:
        core_status = "WARN"
        core_notes.append(f"Missing engine blocks in consolidated payload: {missing_blocks}")

    layer_checks.append(LayerCheck(layer_name="core_engines_payload", status=core_status, notes=core_notes))

    # recommendations
    if missing:
        recs.append("Ensure reporter schema is always enforced before response.")
    if unsupported:
        recs.append("Add stricter reporter prompt: mention only numbers present in payload.")
    if missing_blocks:
        recs.append("Populate all engine sections before report generation for stable comparisons.")

    return contradictions, unsupported, layer_checks, recs


def _llm_audit_optional(
    engine_payload: Dict[str, Any],
    reporter_output: Dict[str, Any],
) -> Tuple[bool, Optional[str], List[UnsupportedClaim]]:
    """
    Optional semantic audit for non-numeric unsupported claims.
    Called only when enabled and client exists.
    """
    if not CRITIC_ENABLE_LLM_AUDIT or _client is None:
        return False, None, []

    prompt = f"""
You are a strict factual auditor.
Compare REPORTER_OUTPUT against ENGINE_PAYLOAD.
Find claims in REPORTER_OUTPUT not supported by ENGINE_PAYLOAD.
Do NOT judge style. Only factual support.

ENGINE_PAYLOAD:
{json.dumps(engine_payload, ensure_ascii=False)}

REPORTER_OUTPUT:
{json.dumps(reporter_output, ensure_ascii=False)}

Return JSON:
{{
  "notes": "short summary",
  "unsupported_claims": [
    {{"claim_text": "...", "reason": "...", "severity": "INFO|WARN|ERROR"}}
  ]
}}
"""

    config = types.GenerateContentConfig(
        temperature=0.0,
        response_mime_type="application/json",
    )
    try:
        resp = _client.models.generate_content(
            model=CRITIC_MODEL,
            contents=prompt,
            config=config,
        )
        raw = resp.text or "{}"
        parsed = json.loads(raw)
        claims = [
            UnsupportedClaim(
                claim_text=str(c.get("claim_text", "")),
                reason=str(c.get("reason", "")),
                severity=str(c.get("severity", "WARN")).upper(),
            )
            for c in parsed.get("unsupported_claims", []) if isinstance(c, dict)
        ]
        notes = str(parsed.get("notes", "")).strip() or None
        return True, notes, claims
    except Exception as e:
        return True, f"LLM audit failed or unavailable ({e}); ignored.", []


def _compute_score(
    contradictions: List[Contradiction],
    unsupported: List[UnsupportedClaim],
    layer_checks: List[LayerCheck],
) -> Tuple[float, str]:
    score = 100.0
    score -= 18.0 * sum(1 for c in contradictions if c.severity == "ERROR")
    score -= 10.0 * sum(1 for c in contradictions if c.severity == "WARN")
    score -= 8.0 * sum(1 for u in unsupported if u.severity == "ERROR")
    score -= 4.0 * sum(1 for u in unsupported if u.severity == "WARN")
    score -= 2.0 * sum(1 for u in unsupported if u.severity == "INFO")
    score -= 15.0 * sum(1 for l in layer_checks if l.status == "FAIL")
    score -= 6.0 * sum(1 for l in layer_checks if l.status == "WARN")

    score = max(0.0, min(100.0, round(score, 2)))

    if score >= 85:
        verdict = "PASS"
    elif score >= 65:
        verdict = "WARN"
    else:
        verdict = "FAIL"
    return score, verdict


def run_critic(payload: CriticInput) -> Dict[str, Any]:
    contradictions, unsupported, layer_checks, recs = _deterministic_checks(
        payload.engine_payload, payload.reporter_output, payload.copilot_output
    )

    llm_used, llm_notes, llm_claims = _llm_audit_optional(
        payload.engine_payload, payload.reporter_output
    )

    # merge + dedupe by claim text
    seen = set()
    merged_unsupported: List[UnsupportedClaim] = []
    for c in [*unsupported, *llm_claims]:
        key = (c.claim_text.strip().lower(), c.reason.strip().lower())
        if key not in seen:
            seen.add(key)
            merged_unsupported.append(c)

    score, verdict = _compute_score(contradictions, merged_unsupported, layer_checks)

    summary = (
        "Narrative is faithful to deterministic outputs."
        if verdict == "PASS"
        else "Narrative needs review due to contradictions or unsupported claims."
    )

    out = CriticOutput(
        generated_at=datetime.now(timezone.utc).isoformat(),
        summary=summary,
        faithfulness_score=score,
        verdict=verdict,
        contradictions=contradictions,
        unsupported_claims=merged_unsupported,
        layer_checks=layer_checks,
        recommendations=recs or ["No major corrective actions required."],
        llm_audit_used=llm_used,
        llm_audit_notes=llm_notes,
    ).model_dump()

    log_agent_trace(
        session_id=payload.session_id,
        user_id=payload.user_id,
        agent_name="critic",
        event_type="faithfulness_audit_complete",
        trace_payload={"input": payload.model_dump(), "output": out},
        status="ok" if verdict != "FAIL" else "warn",
    )

    return out