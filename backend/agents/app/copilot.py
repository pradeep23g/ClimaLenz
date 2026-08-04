from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from .database import get_chat_memory, log_agent_trace, log_chat_turn

load_dotenv()

MODEL_NAME = os.getenv("GEMINI_COPILOT_MODEL", "gemini-2.5-pro")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()

HEAT_ENGINE_URL = os.getenv("HEAT_ENGINE_URL", "http://localhost:8001").rstrip("/")
WATER_ENGINE_URL = os.getenv("WATER_ENGINE_URL", "http://localhost:8002").rstrip("/")
CONTINUITY_ENGINE_URL = os.getenv("CONTINUITY_ENGINE_URL", "http://localhost:8003").rstrip("/")
COLOCATION_ENGINE_URL = os.getenv("COLOCATION_ENGINE_URL", "http://localhost:8004").rstrip("/")

if not GOOGLE_API_KEY:
    raise RuntimeError("Missing GOOGLE_API_KEY in environment.")

client = genai.Client(api_key=GOOGLE_API_KEY)


class CopilotInput(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    prompt: str = Field(..., min_length=2)


def run_heat_what_if(intervention_type: str, delta: float) -> Dict[str, Any]:
    r = requests.post(
        f"{HEAT_ENGINE_URL}/what-if",
        json={"intervention_type": intervention_type, "delta": delta},
        timeout=25,
    )
    r.raise_for_status()
    return r.json()


def assess_water_risk(aoi_id: str) -> Dict[str, Any]:
    r = requests.post(
        f"{WATER_ENGINE_URL}/assess",
        json={"aoi_id": aoi_id},
        timeout=25,
    )
    r.raise_for_status()
    return r.json()


def get_continuity_repair(grid_id: str) -> Dict[str, Any]:
    r = requests.post(
        f"{CONTINUITY_ENGINE_URL}/repair",
        json={"grid_id": grid_id},
        timeout=25,
    )
    r.raise_for_status()
    return r.json()


def get_colocation_assessment(location: str) -> Dict[str, Any]:
    r = requests.post(
        f"{COLOCATION_ENGINE_URL}/assess",
        json={"location": location},
        timeout=25,
    )
    r.raise_for_status()
    return r.json()


def _tools() -> List[types.Tool]:
    return [
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="run_heat_what_if",
                    description="Run heat what-if scenario for an intervention delta.",
                    parameters={
                        "type": "object",
                        "properties": {
                            "intervention_type": {"type": "string"},
                            "delta": {"type": "number"},
                        },
                        "required": ["intervention_type", "delta"],
                    },
                ),
                types.FunctionDeclaration(
                    name="assess_water_risk",
                    description="Assess water risk for an AOI id.",
                    parameters={
                        "type": "object",
                        "properties": {"aoi_id": {"type": "string"}},
                        "required": ["aoi_id"],
                    },
                ),
                types.FunctionDeclaration(
                    name="get_continuity_repair",
                    description="Get continuity repair plan for a grid id.",
                    parameters={
                        "type": "object",
                        "properties": {"grid_id": {"type": "string"}},
                        "required": ["grid_id"],
                    },
                ),
                types.FunctionDeclaration(
                    name="get_colocation_assessment",
                    description="Get co-location assessment for a location.",
                    parameters={
                        "type": "object",
                        "properties": {"location": {"type": "string"}},
                        "required": ["location"],
                    },
                ),
            ]
        )
    ]


def run_copilot(payload: CopilotInput) -> Dict[str, Any]:
    memory = get_chat_memory(session_id=payload.session_id, limit=6)
    memory_txt = "\n".join(
        [
            f"User: {m.get('user_prompt','')}\nAssistant: {json.dumps(m.get('assistant_response', {}))}"
            for m in reversed(memory)
        ]
    )

    system_prompt = f"""
You are ClimaLenz Co-pilot.
You can call read-only tools to invoke deterministic engines.
Never fabricate tool outputs.
If no tool is needed, provide a concise direct answer.
Recent memory:
{memory_txt}
"""

    config = types.GenerateContentConfig(
        tools=_tools(),
        temperature=0.2,
    )

    first = client.models.generate_content(
        model=MODEL_NAME,
        contents=[system_prompt, payload.prompt],
        config=config,
    )

    tool_results: List[Dict[str, Any]] = []

    if first.candidates and first.candidates[0].content and first.candidates[0].content.parts:
        for part in first.candidates[0].content.parts:
            fc = getattr(part, "function_call", None)
            if not fc:
                continue

            name = fc.name
            args = dict(fc.args or {})

            if name == "run_heat_what_if":
                result = run_heat_what_if(
                    intervention_type=str(args["intervention_type"]),
                    delta=float(args["delta"]),
                )
            elif name == "assess_water_risk":
                result = assess_water_risk(aoi_id=str(args["aoi_id"]))
            elif name == "get_continuity_repair":
                result = get_continuity_repair(grid_id=str(args["grid_id"]))
            elif name == "get_colocation_assessment":
                result = get_colocation_assessment(location=str(args["location"]))
            else:
                result = {"error": f"Unsupported tool: {name}"}

            tool_results.append({"tool": name, "args": args, "result": result})

    if tool_results:
        final = client.models.generate_content(
            model=MODEL_NAME,
            contents=[
                system_prompt,
                payload.prompt,
                f"Tool results:\n{json.dumps(tool_results, ensure_ascii=False)}",
                "Summarize for user in concise actionable form.",
            ],
        )
        answer_text = final.text or "Completed tool execution."
    else:
        answer_text = first.text or "I could not determine a tool to run."

    response = {
        "answer": answer_text,
        "tool_results": tool_results,
        "model": MODEL_NAME,
    }

    log_agent_trace(
        session_id=payload.session_id,
        user_id=payload.user_id,
        agent_name="copilot",
        event_type="chat_turn_complete",
        trace_payload={"prompt": payload.prompt, "response": response},
        status="ok",
    )

    log_chat_turn(
        session_id=payload.session_id,
        user_id=payload.user_id,
        user_prompt=payload.prompt,
        assistant_response=response,
        tool_calls=tool_results,
        model_name=MODEL_NAME,
    )

    return response