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


# Point Google Cloud Auth directly to your untracked service account key
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/home/dharshansri2007/lenz/backend/gcp-key.json"

# ------------------------------------
MODEL_NAME = os.getenv("GEMINI_COPILOT_MODEL", "gemini-2.5-pro")

HEAT_ENGINE_URL = os.getenv("HEAT_ENGINE_URL", "http://localhost:8002").rstrip("/")
WATER_ENGINE_URL = os.getenv("WATER_ENGINE_URL", "http://localhost:8001").rstrip("/")
CONTINUITY_ENGINE_URL = os.getenv("CONTINUITY_ENGINE_URL", "http://localhost:8003").rstrip("/")
COLOCATION_ENGINE_URL = os.getenv("COLOCATION_ENGINE_URL", "http://localhost:8004").rstrip("/")

# Initialize the unified SDK client in Vertex AI mode
client = genai.Client(
    vertexai=True,
    project="lenz-500509",
    location="us-central1"
)
# ------------------------------------


class CopilotInput(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    prompt: str = Field(..., min_length=2)


def _post(url: str, payload: Dict[str, Any], *, timeout: int = 25) -> Dict[str, Any]:
    """
    Shared POST helper. Raises requests.HTTPError / requests.RequestException on
    failure — callers are responsible for catching and converting into a
    structured tool_result so one dead downstream service can't 500 the
    whole copilot turn.
    """
    r = requests.post(url, json=payload, timeout=timeout)
    r.raise_for_status()
    return r.json()


def run_heat_what_if(
    intervention_type: str,
    delta: float,
    bbox: Optional[List[float]] = None,
    date_range: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Matches heat_engine's real contract: POST /v1/simulations/what-if
    (see backend/heat_engine/app/main.py + models/simulation_schemas.py).
    bbox / date_range are optional — the engine defaults them (Chennai bbox)
    if omitted, so the copilot only has to supply what the user actually
    specified.
    """
    payload: Dict[str, Any] = {"intervention_type": intervention_type, "delta": delta}
    if bbox is not None:
        payload["bbox"] = bbox
    if date_range is not None:
        payload["date_range"] = date_range
    return _post(f"{HEAT_ENGINE_URL}/v1/simulations/what-if", payload)


def assess_water_risk(
    spatial_geometry: Dict[str, Any],
    observation_lookback_days: int = 30,
    cloud_tolerance_pct: float = 30.0,
) -> Dict[str, Any]:
    """
    Matches water_engine's real contract: POST /v1/assessments/generate,
    which requires a GeoJSON Polygon (spatial_geometry) — there is no
    aoi_id concept in that engine.
    """
    payload = {
        "spatial_geometry": spatial_geometry,
        "observation_lookback_days": observation_lookback_days,
        "cloud_tolerance_pct": cloud_tolerance_pct,
    }
    return _post(f"{WATER_ENGINE_URL}/v1/assessments/generate", payload)


def get_continuity_repair(
    geometry: Dict[str, Any],
    start_date: str,
    end_date: str,
) -> Dict[str, Any]:
    """
    Matches continuity_engine's real contract: POST /v1/reconstruction/repair,
    requiring a GeoJSON geometry plus a start/end date (ISO 'YYYY-MM-DD') —
    there is no grid_id concept in that engine.
    """
    payload = {"geometry": geometry, "start_date": start_date, "end_date": end_date}
    return _post(f"{CONTINUITY_ENGINE_URL}/v1/reconstruction/repair", payload)


def get_colocation_assessment(
    spatial_geometry: Dict[str, Any],
    bbox: List[float],
    intervention_type: str = "CANOPY",
    delta: float = 0.15,
) -> Dict[str, Any]:
    """
    Matches the bridge service's real contract: POST /v1/colocation/assess
    (backend/bridge/app/main.py), which fans out to water_engine + heat_engine
    itself. Requires both spatial_geometry (GeoJSON, for water_engine) and
    bbox (for heat_engine) describing the same AOI — there is no bare
    'location' string concept in that engine.
    """
    payload = {
        "spatial_geometry": spatial_geometry,
        "bbox": bbox,
        "intervention_type": intervention_type,
        "delta": delta,
    }
    return _post(f"{COLOCATION_ENGINE_URL}/v1/colocation/assess", payload)


_GEOJSON_POLYGON_SCHEMA = {
    "type": "object",
    "description": (
        "GeoJSON Polygon geometry, e.g. "
        '{"type": "Polygon", "coordinates": [[[lon, lat], ...]]}'
    ),
}


def _tools() -> List[types.Tool]:
    return [
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="run_heat_what_if",
                    description=(
                        "Run heat_engine's what-if PINN simulation for a micro-climate "
                        "intervention delta over an AOI."
                    ),
                    parameters={
                        "type": "object",
                        "properties": {
                            "intervention_type": {
                                "type": "string",
                                "description": "e.g. CANOPY, ALBEDO, etc.",
                            },
                            "delta": {
                                "type": "number",
                                "description": "Magnitude of the intervention, between -1.0 and 1.0.",
                            },
                            "bbox": {
                                "type": "array",
                                "items": {"type": "number"},
                                "description": "[min_lon, min_lat, max_lon, max_lat]. Optional — omit to use the engine default AOI.",
                            },
                            "date_range": {
                                "type": "string",
                                "description": "STAC-style 'start/end' ISO date range. Optional.",
                            },
                        },
                        "required": ["intervention_type", "delta"],
                    },
                ),
                types.FunctionDeclaration(
                    name="assess_water_risk",
                    description="Run water_engine's deterministic ecological risk assessment for an AOI polygon.",
                    parameters={
                        "type": "object",
                        "properties": {
                            "spatial_geometry": _GEOJSON_POLYGON_SCHEMA,
                            "observation_lookback_days": {"type": "integer"},
                            "cloud_tolerance_pct": {"type": "number"},
                        },
                        "required": ["spatial_geometry"],
                    },
                ),
                types.FunctionDeclaration(
                    name="get_continuity_repair",
                    description=(
                        "Run continuity_engine's SAR-guided cloud reconstruction for an AOI "
                        "over a date window, to repair cloud-obscured optical imagery."
                    ),
                    parameters={
                        "type": "object",
                        "properties": {
                            "geometry": _GEOJSON_POLYGON_SCHEMA,
                            "start_date": {"type": "string", "description": "ISO date, YYYY-MM-DD."},
                            "end_date": {"type": "string", "description": "ISO date, YYYY-MM-DD."},
                        },
                        "required": ["geometry", "start_date", "end_date"],
                    },
                ),
                types.FunctionDeclaration(
                    name="get_colocation_assessment",
                    description=(
                        "Run the bridge service's combined water+heat co-location assessment "
                        "for one AOI (same geometry expressed both as a polygon and a bbox)."
                    ),
                    parameters={
                        "type": "object",
                        "properties": {
                            "spatial_geometry": _GEOJSON_POLYGON_SCHEMA,
                            "bbox": {
                                "type": "array",
                                "items": {"type": "number"},
                                "description": "[min_lon, min_lat, max_lon, max_lat] for the same AOI.",
                            },
                            "intervention_type": {"type": "string"},
                            "delta": {"type": "number"},
                        },
                        "required": ["spatial_geometry", "bbox"],
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

    try:
        first = client.models.generate_content(
            model=MODEL_NAME,
            contents=[system_prompt, payload.prompt],
            config=config,
        )
    except Exception as e:
        return {
            "answer": "Copilot generated in offline mode (Gemini API unreachable).",
            "tool_results": [],
            "model": MODEL_NAME,
        }

    tool_results: List[Dict[str, Any]] = []

    if first.candidates and first.candidates[0].content and first.candidates[0].content.parts:
        for part in first.candidates[0].content.parts:
            fc = getattr(part, "function_call", None)
            if not fc:
                continue

            name = fc.name
            args = dict(fc.args or {})

            try:
                if name == "run_heat_what_if":
                    result = run_heat_what_if(
                        intervention_type=str(args["intervention_type"]),
                        delta=float(args["delta"]),
                        bbox=[float(x) for x in args["bbox"]] if args.get("bbox") else None,
                        date_range=args.get("date_range"),
                    )
                elif name == "assess_water_risk":
                    result = assess_water_risk(
                        spatial_geometry=dict(args["spatial_geometry"]),
                        observation_lookback_days=int(args.get("observation_lookback_days", 30)),
                        cloud_tolerance_pct=float(args.get("cloud_tolerance_pct", 30.0)),
                    )
                elif name == "get_continuity_repair":
                    result = get_continuity_repair(
                        geometry=dict(args["geometry"]),
                        start_date=str(args["start_date"]),
                        end_date=str(args["end_date"]),
                    )
                elif name == "get_colocation_assessment":
                    result = get_colocation_assessment(
                        spatial_geometry=dict(args["spatial_geometry"]),
                        bbox=[float(x) for x in args["bbox"]],
                        intervention_type=str(args.get("intervention_type", "CANOPY")),
                        delta=float(args.get("delta", 0.15)),
                    )
                else:
                    result = {"error": f"Unsupported tool: {name}"}
            except KeyError as missing:
                result = {"error": f"Model omitted required argument {missing} for tool '{name}'."}
            except requests.HTTPError as http_err:
                status_code = http_err.response.status_code if http_err.response is not None else None
                body = http_err.response.text if http_err.response is not None else str(http_err)
                result = {
                    "error": f"Downstream engine call for '{name}' failed (HTTP {status_code}).",
                    "detail": body,
                }
            except requests.RequestException as req_err:
                result = {"error": f"Could not reach downstream engine for '{name}': {req_err}"}

            tool_results.append({"tool": name, "args": args, "result": result})

    if tool_results:
        try:
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
        except Exception as e:
            answer_text = "Copilot completed tool execution, but failed to generate a summary (Gemini API unreachable)."
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