from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .copilot import CopilotInput, run_copilot
from .critic import CriticInput, run_critic
from .historian import HistorianInput, run_historian
from .reporter import ReporterInput, run_reporter

app = FastAPI(title="ClimaLenz Agent Layer", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HistorianRequest(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    aoi_name: str
    engine_context: Dict[str, Any]


class ReporterRequest(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    consolidated_payload: Dict[str, Any]


class CopilotRequest(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    prompt: str


class CriticRequest(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    engine_payload: Dict[str, Any]
    reporter_output: Dict[str, Any]
    copilot_output: Optional[Dict[str, Any]] = None


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/historian/ground")
def historian_ground(req: HistorianRequest) -> Dict[str, Any]:
    try:
        return run_historian(HistorianInput(**req.model_dump()))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Historian failed: {exc}") from exc


@app.post("/api/reporter/generate")
def reporter_generate(req: ReporterRequest) -> Dict[str, Any]:
    try:
        return run_reporter(ReporterInput(**req.model_dump()))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Reporter failed: {exc}") from exc


@app.post("/api/copilot/chat")
def copilot_chat(req: CopilotRequest) -> Dict[str, Any]:
    try:
        return run_copilot(CopilotInput(**req.model_dump()))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Copilot failed: {exc}") from exc


@app.post("/api/critic/audit")
def critic_audit(req: CriticRequest) -> Dict[str, Any]:
    try:
        return run_critic(CriticInput(**req.model_dump()))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Critic failed: {exc}") from exc