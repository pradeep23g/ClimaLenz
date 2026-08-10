from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

logger = logging.getLogger(__name__)

_client: Optional[Client] = None


def get_db() -> Client:
    """Return shared Supabase client instance."""
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL", "").strip()
        key = os.getenv("SUPABASE_KEY", "").strip()
        if not url or not key:
            raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY.")
        _client = create_client(url, key)
    return _client


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def log_agent_trace(
    *,
    session_id: str,
    user_id: Optional[str],
    agent_name: str,
    event_type: str,
    trace_payload: Dict[str, Any],
    status: str = "ok",
) -> List[Dict[str, Any]]:
    """
    Persist agent trace logs (JSONB-compatible payload).

    Expected table:
      agent_traces(
        id uuid default gen_random_uuid() primary key,
        session_id text not null,
        user_id text null,
        agent_name text not null,
        event_type text not null,
        status text not null,
        trace_payload jsonb not null,
        created_at timestamptz default now()
      )
    """
    row = {
        "session_id": session_id,
        "user_id": user_id,
        "agent_name": agent_name,
        "event_type": event_type,
        "status": status,
        "trace_payload": trace_payload,
        "created_at": _utc_now_iso(),
    }
    try:
        res = get_db().table("agent_traces").insert(row).execute()
        return res.data or []
    except Exception as e:
        logger.error(f"[DB ERROR] Failed to log agent trace for session '{session_id}': {e}")
        return []


def get_session_history(
    *,
    session_id: str,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    Fetch recent session history for a session_id from agent_traces.
    """
    limit = max(1, min(limit, 200))
    try:
        result = (
            get_db()
            .table("agent_traces")
            .select("*")
            .eq("session_id", session_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []
    except Exception as e:
        logger.error(f"[DB ERROR] Failed to fetch session history for session '{session_id}': {e}")
        return []


def log_chat_turn(
    *,
    session_id: str,
    user_id: Optional[str],
    user_prompt: str,
    assistant_response: Dict[str, Any],
    tool_calls: Optional[List[Dict[str, Any]]] = None,
    model_name: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Persist chat memory turns.

    Expected table:
      agent_chat_memory(
        id uuid default gen_random_uuid() primary key,
        session_id text not null,
        user_id text null,
        user_prompt text not null,
        assistant_response jsonb not null,
        tool_calls jsonb null,
        model_name text null,
        created_at timestamptz default now()
      )
    """
    row = {
        "session_id": session_id,
        "user_id": user_id,
        "user_prompt": user_prompt,
        "assistant_response": assistant_response,
        "tool_calls": tool_calls or [],
        "model_name": model_name,
        "created_at": _utc_now_iso(),
    }
    try:
        res = get_db().table("agent_chat_memory").insert(row).execute()
        return res.data or []
    except Exception as e:
        logger.error(f"[DB ERROR] Failed to log chat turn for session '{session_id}': {e}")
        return []


def get_chat_memory(
    *,
    session_id: str,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """
    Fetch chat memory turns for a session.
    """
    limit = max(1, min(limit, 100))
    try:
        result = (
            get_db()
            .table("agent_chat_memory")
            .select("*")
            .eq("session_id", session_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []
    except Exception as e:
        logger.error(f"[DB ERROR] Failed to fetch chat memory for session '{session_id}': {e}")
        return []