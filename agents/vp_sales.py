"""
VP Sales & Service — manages leads, follow-ups, and customer success.

Team:
  - Lead Tracker: monitors new leads from Green Invoice + Stripe signups
  - Follow-up Agent: drafts follow-up messages for open leads
  - Conversion Analyzer: tracks conversion rates and pipeline health
  - Support Agent: monitors for customer issues and open tickets
"""
import os, time, json, logging, httpx
from datetime import datetime, timezone, date, timedelta

from base_agent import (
    db, memory_get, memory_set, send_message,
    open_incident, write_report, request_decision, ask_claude
)

AGENT_ID = "vp_sales"
logger = logging.getLogger(AGENT_ID)

SOCIAL_AI_BACKEND = os.environ.get("SOCIAL_AI_HEALTH_URL", "").replace("/health", "")


# ── Team: Lead Tracker ─────────────────────────────────────────────────────

def lead_tracker_fetch() -> dict:
    """Fetches leads and signups from all sources."""
    result = {"social_ai_signups": [], "md_clinic_leads": []}

    # Social AI — new subscriptions from Stripe
    try:
        subs = db().table("subscriptions").select("tenant_id,plan,status,created_at") \
            .order("created_at", desc=True).limit(10).execute().data or []
        result["social_ai_signups"] = subs
    except Exception as e:
        logger.debug(f"Subscriptions fetch: {e}")

    # M.D Clinic — agent_messages with payment alerts from CEO
    try:
        leads = db().table("agent_messages").select("subject,body,created_at") \
            .eq("from_agent", "ceo").ilike("subject", "%תשלום%") \
            .order("created_at", desc=True).limit(5).execute().data or []
        result["md_clinic_leads"] = leads
    except Exception as e:
        logger.debug(f"Leads fetch: {e}")

    return result


# ── Team: Follow-up Agent ──────────────────────────────────────────────────

def follow_up_agent_draft(lead_name: str, product: str, days_since: int) -> str:
    """Drafts a follow-up message for a lead."""
    return ask_claude(
        system="אתה מנהל מכירות מנוסה. כתוב הודעת מעקב קצרה (3 משפטים) בעברית, חמה ולא אגרסיבית.",
        user=f"ליד: {lead_name}\nמוצר: {product}\nימים מאז יצירת קשר: {days_since}\nכתוב הצעת המשך.",
        max_tokens=150,
    )


# ── Team: Conversion Analyzer ──────────────────────────────────────────────

def conversion_analyzer_report(leads: dict) -> str:
    """Analyzes conversion funnel and returns insights."""
    signups = leads.get("social_ai_signups", [])
    active = sum(1 for s in signups if s.get("status") == "active")
    trial = sum(1 for s in signups if s.get("status") == "trialing")
    canceled = sum(1 for s in signups if s.get("status") == "canceled")

    plan_dist = {}
    for s in signups:
        plan_dist[s.get("plan", "?")] = plan_dist.get(s.get("plan", "?"), 0) + 1

    lines = [
        f"Social AI — לקוחות: {active} פעיל, {trial} ניסיון, {canceled} ביטול",
        f"חלוקת תוכניות: {plan_dist}",
        f"M.D Clinic — לידים: {len(leads.get('md_clinic_leads', []))}",
    ]
    return "\n".join(lines)


# ── Team: Support Agent ────────────────────────────────────────────────────

def support_agent_check() -> list[str]:
    """Checks for open incidents that might affect customers."""
    try:
        incidents = db().table("incidents").select("project,title,severity,created_at") \
            .eq("status", "open").execute().data or []
        return [f"[{i['severity'].upper()}] {i['project']}: {i['title']}" for i in incidents]
    except Exception:
        return []


# ── Daily run ──────────────────────────────────────────────────────────────

def run_once():
    logger.info("💼 VP Sales — checking pipeline")
    today = str(date.today())

    leads = lead_tracker_fetch()
    conversion = conversion_analyzer_report(leads)
    open_issues = support_agent_check()

    issues_text = "\n".join(f"  {i}" for i in open_issues) if open_issues else "  אין בעיות פתוחות ✅"

    body = (
        f"דוח VP Sales — {today}\n\n"
        f"Pipeline:\n{conversion}\n\n"
        f"בעיות פתוחות שמשפיעות על לקוחות:\n{issues_text}"
    )

    last = memory_get(AGENT_ID, "last_report_date")
    if last != today:
        write_report(AGENT_ID, f"דוח מכירות — {today}", body)
        priority = "high" if open_issues else "low"
        send_message(AGENT_ID, "ceo", f"💼 דוח מכירות — {today}", body, priority=priority)
        memory_set(AGENT_ID, "last_report_date", today)

    # Alert CEO if customers are affected by incidents
    if open_issues:
        send_message(AGENT_ID, "ceo",
            "⚠️ בעיות פתוחות שמשפיעות על לקוחות",
            "\n".join(open_issues), priority="high")


if __name__ == "__main__":
    interval = int(os.environ.get("SALES_INTERVAL_SECONDS", "3600"))
    while True:
        try:
            run_once()
        except Exception as e:
            logger.error(f"VP Sales error: {e}")
        time.sleep(interval)
