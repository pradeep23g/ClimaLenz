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

MODEL_NAME = os.getenv("GEMINI_HISTORIAN_MODEL", "gemini-2.5-pro")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()

if not GOOGLE_API_KEY:
    raise RuntimeError("Missing GOOGLE_API_KEY in environment.")

client = genai.Client(api_key=GOOGLE_API_KEY)


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


def run_historian(payload: HistorianInput) -> Dict[str, Any]:
    system_instruction = (
        "You are ClimaLenz Historian.\n"
        "Goal: Ground deterministic ecological engine outputs with recent, real-world evidence near the AOI.\n"
        "Instructions:\n"
        "1. Search for recent and relevant reports/articles on: flooding, drought, "
        "urban heat island, industrial discharge, municipal adaptation projects near the AOI.\n"
        "2. Cross-reference findings with engine_context metrics.\n"
        "3. Be explicit about uncertainty if evidence is weak."
    )

    prompt = f"""
AOI: {payload.aoi_name}
Engine Context JSON:
{payload.engine_context}
"""

    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        tools=[types.Tool(google_search=types.GoogleSearch())],
        temperature=0.2,
        response_mime_type="application/json",
        response_schema=HistorianLLMOutput,
    )

    resp = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=config,
    )

    text = resp.text or "{}"
    
    # Extract actual Google Search grounding metadata if present
    extracted_grounding: Dict[str, Any] = {"model": MODEL_NAME}
    if resp.candidates and len(resp.candidates) > 0:
        cand_metadata = getattr(resp.candidates[0], "grounding_metadata", None)
        if cand_metadata:
            extracted_grounding["search_queries"] = getattr(
                cand_metadata, "web_search_queries", []
            )

    try:
        # Validate against the LLM output model
        llm_data = HistorianLLMOutput.model_validate_json(text)
        
        # Combine into full output model
        full_output = HistorianOutput(
            **llm_data.model_dump(),
            generated_at=datetime.now(timezone.utc).isoformat(),
            grounding_metadata=extracted_grounding,
        )
        parsed = full_output.model_dump()

    except ValidationError as err:
        parsed = {
            "aoi_name": payload.aoi_name,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "contextual_summary": "Unable to fully structure grounded summary. Raw model output captured.",
            "corroboration_points": [],
            "contradictions_or_gaps": [f"Model output schema mismatch: {str(err)}"],
            "confidence": "LOW",
            "sources": [],
            "grounding_metadata": {"raw_text": text, **extracted_grounding},
        }

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