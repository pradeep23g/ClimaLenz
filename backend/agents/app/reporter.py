from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Literal, Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field, ValidationError

from .database import log_agent_trace

load_dotenv()

logger = logging.getLogger(__name__)

MODEL_NAME = os.getenv("GEMINI_REPORTER_MODEL", "gemini-2.5-flash")

# --- SURGICAL VERTEX AI INJECTION ---
# Point Google Cloud Auth directly to your untracked service account key
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/home/dharshansri2007/lenz/backend/gcp-key.json"

# Initialize the unified SDK client in Vertex AI mode
client = genai.Client(
    vertexai=True,
    project="lenz-500509",
    location="us-central1"
)
# ------------------------------------


class ReporterInput(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    consolidated_payload: Dict[str, Any]


class ReporterSchema(BaseModel):
    executive_summary: str = Field(..., description="High-level narrative summary of findings.")
    key_findings: List[str] = Field(..., description="Key observation points from the payload.")
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    recommended_interventions: List[str] = Field(..., description="Actionable recommendations.")
    limitations_disclaimer: str = Field(..., description="Caveats and analytical limitations.")


def run_reporter(payload: ReporterInput) -> Dict[str, Any]:
    system_instruction = (
        "You are ClimaLenz Reporter.\n"
        "You MUST NOT recompute, alter, infer, or overwrite numeric outputs.\n"
        "Only translate the provided deterministic payload into clear, professional narrative.\n"
        "Rules:\n"
        "1. Preserve all numeric values exactly if referenced.\n"
        "2. If data is missing, state clearly that it is missing.\n"
        "3. Avoid overclaiming causality."
    )

    prompt = f"""
Payload:
{payload.consolidated_payload}
"""

    # Pass the Pydantic model directly to response_schema
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=0.1,
        response_mime_type="application/json",
        response_schema=ReporterSchema,
    )

    try:
        resp = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=config,
        )
        raw = resp.text or "{}"
        result = ReporterSchema.model_validate_json(raw).model_dump()

    except ValidationError as err:
        logger.warning(f"[REPORTER SCHEMA ERROR] Output validation failed: {err}")
        result = {
            "executive_summary": "Unable to generate fully structured report from engine outputs.",
            "key_findings": [],
            "risk_level": "MEDIUM",
            "recommended_interventions": [],
            "limitations_disclaimer": (
                "Structured output validation failed; raw model response requires manual verification."
            ),
        }
    except Exception as err:
        logger.error(f"[REPORTER API ERROR] Call failed: {err}")
        result = {
            "executive_summary": "Report generation service unavailable.",
            "key_findings": [],
            "risk_level": "MEDIUM",
            "recommended_interventions": [],
            "limitations_disclaimer": f"System error during generation: {str(err)}",
        }

    log_agent_trace(
        session_id=payload.session_id,
        user_id=payload.user_id,
        agent_name="reporter",
        event_type="narrative_generated",
        trace_payload={
            "input": payload.model_dump(),
            "output": result,
            "model": MODEL_NAME,
        },
        status="ok",
    )
    return result