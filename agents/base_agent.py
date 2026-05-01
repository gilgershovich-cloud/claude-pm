"""
Base utilities shared by all AI Company OS agents.
"""
import os
import json
import logging
from datetime import datetime, timezone
from typing import Any

import httpx
import anthropic
from supabase import create_client, Client

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s"
)

SUPABASE_URL = os.environ["COMPANY_OS_SUPABASE_URL"]
SUPABASE_KEY = os.environ["COMPANY_OS_SUPABASE_SERVICE_KEY"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]

# WhatsApp bridge (M.D Clinic bridge.js — Cloudflare Tunnel URL)
MD_CLINIC_BRIDGE_URL = os.environ.get("MD_CLINIC_BRIDGE_URL", "")
GIL_WHATSAPP = os.environ.get("GIL_WHATSAPP_NUMBER", "972524552697")

_supabase: Client | None = None
_anthropic: anthropic.Anthropic | None = None


def db() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase


def ai() -> anthropic.Anthropic:
    global _anthropic
    if _anthropic is None:
        _anthropic = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    return _anthropic


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ────────────────────────────────────────────
# WhatsApp
# ────────────────────────────────────────────

def send_whatsapp_to_gil(message: str) -> bool:
    """
    Sends a WhatsApp message to Gil via M.D Clinic bridge.js.
    Requires MD_CLINIC_BRIDGE_URL to be set (Cloudflare Tunnel URL).
    Returns True on success, False if bridge not available.
    """
    if not MD_CLINIC_BRIDGE_URL:
        logging.getLogger("whatsapp").debug("MD_CLINIC_BRIDGE_URL not set — skipping WhatsApp")
        return False
    try:
        resp = httpx.post(
            f"{MD_CLINIC_BRIDGE_URL}/send",
            json={"to": f"{GIL_WHATSAPP}@c.us", "message": message},
            timeout=10,
            headers={"X-Bridge-Secret": os.environ.get("BRIDGE_SECRET", "")},
        )
        if resp.status_code == 200:
            logging.getLogger("whatsapp").info(f"📱 WhatsApp sent to Gil")
            return True
        else:
            logging.getLogger("whatsapp").warning(f"WhatsApp failed: {resp.status_code}")
            return False
    except Exception as e:
        logging.getLogger("whatsapp").warning(f"WhatsApp error: {e}")
        return False


# ────────────────────────────────────────────
# Memory
# ────────────────────────────────────────────

def memory_get(agent_id: str, key: str, default: Any = None) -> Any:
    row = db().table("agent_memory").select("value").eq("agent_id", agent_id).eq("key", key).maybe_single().execute().data
    return row["value"] if row else default


def memory_set(agent_id: str, key: str, value: Any) -> None:
    db().table("agent_memory").upsert(
        {"agent_id": agent_id, "key": key, "value": value, "updated_at": now_iso()},
        on_conflict="agent_id,key"
    ).execute()


# ────────────────────────────────────────────
# Inbox
# ────────────────────────────────────────────

def send_message(from_agent: str, to_agent: str, subject: str, body: str, priority: str = "medium") -> None:
    db().table("agent_messages").insert({
        "from_agent": from_agent,
        "to_agent": to_agent,
        "subject": subject,
        "body": body,
        "priority": priority,
    }).execute()
    logging.getLogger(from_agent).info(f"📨 → {to_agent}: {subject}")


# ────────────────────────────────────────────
# Incidents
# ────────────────────────────────────────────

def open_incident(agent_id: str, project: str, title: str, description: str, severity: str = "medium") -> str:
    row = db().table("incidents").insert({
        "agent_id": agent_id,
        "project": project,
        "severity": severity,
        "title": title,
        "description": description,
        "status": "open",
    }).execute().data[0]
    logging.getLogger(agent_id).warning(f"🚨 [{severity.upper()}] {title}")
    return row["id"]


def resolve_incident(incident_id: str) -> None:
    db().table("incidents").update({
        "status": "resolved",
        "resolved_at": now_iso(),
    }).eq("id", incident_id).execute()


def get_open_incidents(project: str | None = None):
    q = db().table("incidents").select("*").eq("status", "open")
    if project:
        q = q.eq("project", project)
    return q.execute().data


# ────────────────────────────────────────────
# Reports
# ────────────────────────────────────────────

def write_report(agent_id: str, title: str, body: str, report_type: str = "daily") -> None:
    db().table("agent_reports").insert({
        "agent_id": agent_id,
        "title": title,
        "body": body,
        "report_type": report_type,
    }).execute()
    logging.getLogger(agent_id).info(f"📋 Report: {title}")


def get_today_reports():
    today = datetime.now(timezone.utc).date().isoformat()
    return db().table("agent_reports").select("*").gte("created_at", today).execute().data


# ────────────────────────────────────────────
# Decisions
# ────────────────────────────────────────────

def request_decision(agent_id: str, title: str, description: str, risk_tier: str) -> str:
    row = db().table("agent_decisions").insert({
        "agent_id": agent_id,
        "title": title,
        "description": description,
        "risk_tier": risk_tier,
        "status": "pending",
    }).execute().data[0]
    logging.getLogger(agent_id).info(f"⚖️ Decision requested [{risk_tier}]: {title}")
    return row["id"]


def get_pending_decisions():
    return db().table("agent_decisions").select("*").eq("status", "pending").execute().data


# ────────────────────────────────────────────
# Claude helper
# ────────────────────────────────────────────

def ask_claude(system: str, user: str, max_tokens: int = 500) -> str:
    resp = ai().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return resp.content[0].text