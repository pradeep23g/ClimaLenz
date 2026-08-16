from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field, ValidationError

from .database import log_agent_trace

load_dotenv()

# ------------------------------------
MODEL_NAME = os.getenv("GEMINI_HISTORIAN_MODEL", "gemini-2.5-pro")

# Initialize the unified SDK client in standard mode
client = genai.Client()
# ------------------------------------


class HistorianInput(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    aoi_name: str = Field(..., min_length=2)
    engine_context: Dict[str, Any]


class SourceCitation(BaseModel):
    title: str
    url: str
    publisher: Optional[str] = None
    published_date: Optional[str] = None
    relevance_note: str


# Schema for the LLM output strictly
class HistorianLLMOutput(BaseModel):
    aoi_name: str
    contextual_summary: str
    corroboration_points: List[str]
    contradictions_or_gaps: List[str]
    confidence: str = Field(..., description="LOW, MEDIUM, or HIGH")
    sources: List[SourceCitation]


# Schema for the final agent return payload
class HistorianOutput(HistorianLLMOutput):
    generated_at: str
    grounding_metadata: Dict[str, Any]


def _fallback_output(payload: HistorianInput, reason: str, extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return {
        "aoi_name": payload.aoi_name,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "contextual_summary": "Unable to fully structure grounded summary. Raw model output captured.",
        "corroboration_points": [],
        "contradictions_or_gaps": [reason],
        "confidence": "LOW",
        "sources": [],
        "grounding_metadata": {"model": MODEL_NAME, **(extra or {})},
    }


def run_historian(payload: HistorianInput) -> Dict[str, Any]:
    """
    Two-call design, deliberately not a single call:

    The Gemini API rejects combining `tools=[google_search]` (grounding) with
    `response_schema`/`response_mime_type="application/json"` (controlled
    generation) in the same request — it returns
    400 INVALID_ARGUMENT: "controlled generation is not supported with
    google_search tool". So we ground first with search enabled and free-form
    text, then make a second, tool-free call to fit that grounded text into
    HistorianLLMOutput's strict schema. This keeps both the citations and the
    structured output the rest of the pipeline (critic/reporter) depends on.
    """
    system_instruction = (
        "You are ClimaLenz Historian.\n"
        "Goal: Ground deterministic ecological engine outputs with recent, real-world evidence near the AOI.\n"
        "Instructions:\n"
        "1. Search for recent and relevant reports/articles on: flooding, drought, "
        "urban heat island, industrial discharge, municipal adaptation projects near the AOI.\n"
        "2. Cross-reference findings with engine_context metrics.\n"
        "3. Be explicit about uncertainty if evidence is weak.\n"
        "4. Include concrete source titles and URLs for anything you cite."
    )

    prompt = f"""
AOI: {payload.aoi_name}
Engine Context JSON:
{payload.engine_context}
"""

    extracted_grounding: Dict[str, Any] = {"model": MODEL_NAME}

    try:
        # --- Call 1: grounded search, free-form text (no response_schema allowed here) ---
        search_config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            tools=[types.Tool(google_search=types.GoogleSearch())],
            temperature=0.2,
        )
        grounded_resp = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=search_config,
        )
        grounded_text = grounded_resp.text or ""

        if grounded_resp.candidates:
            cand_metadata = getattr(grounded_resp.candidates[0], "grounding_metadata", None)
            if cand_metadata:
                extracted_grounding["search_queries"] = getattr(
                    cand_metadata, "web_search_queries", []
                )

        # --- Call 2: restructure the grounded findings into the strict schema ---
        structure_config = types.GenerateContentConfig(
            temperature=0.0,
            response_mime_type="application/json",
            response_schema=HistorianLLMOutput,
        )
        structure_prompt = f"""
Restructure the following grounded research findings into the required JSON schema.
Do not invent facts or sources that are not present below. If evidence is weak or
absent, say so explicitly and set confidence to LOW.

AOI: {payload.aoi_name}

Grounded findings:
{grounded_text}
"""
        structured_resp = client.models.generate_content(
            model=MODEL_NAME,
            contents=structure_prompt,
            config=structure_config,
        )
        text = structured_resp.text or "{}"

        llm_data = HistorianLLMOutput.model_validate_json(text)
        full_output = HistorianOutput(
            **llm_data.model_dump(),
            generated_at=datetime.now(timezone.utc).isoformat(),
            grounding_metadata=extracted_grounding,
        )
        parsed = full_output.model_dump()

    except ValidationError as err:
        parsed = _fallback_output(
            payload,
            f"Model output schema mismatch: {err}",
            extracted_grounding,
        )
    except Exception as err:  # Gemini API errors (400/429/5xx/network) must not 500 this endpoint
        parsed = _fallback_output(
            payload,
            f"Historian grounding/generation call failed: {err}",
            extracted_grounding,
        )

    log_agent_trace(
        session_id=payload.session_id,
        user_id=payload.user_id,
        agent_name="historian",
        event_type="grounding_complete",
        trace_payload={
            "input": payload.model_dump(),
            "output": parsed,
            "model": MODEL_NAME,
        },
        status="ok",
    )
    return parsed