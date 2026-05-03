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

FOLLOW_UP_DAYS = 3  # remind Gil 3 days after sent with no reply


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


# ── Clinic outreach tracker ────────────────────────────────────────────────

def clinic_outreach_run() -> str:
    """
    Checks clinic_outreach table:
    - Clinics pending > 3 days with no reply → remind Gil to follow up
    - Counts pipeline by status
    Returns a summary string for the daily report.
    """
    try:
        r = db().table("clinic_outreach").select("*").execute()
        rows = r.data if r and r.data else []
    except Exception as e:
        logger.debug(f"clinic_outreach fetch: {e}")
        return "טבלת clinic_outreach לא קיימת עדיין — הרץ את create_clinic_outreach.sql"

    if not rows:
        return "רשימת 50 קליניקות ריקה — הוסף לידים לטבלת clinic_outreach"

    now = datetime.now(timezone.utc)
    status_count = {}
    follow_ups_due = []

    for row in rows:
        st = row.get("status", "pending")
        status_count[st] = status_count.get(st, 0) + 1

        # follow-up due: sent but no reply, and follow_up_at has passed
        if st == "sent":
            fu_at = row.get("follow_up_at")
            if fu_at:
                fu_dt = datetime.fromisoformat(fu_at.replace("Z", "+00:00"))
                if now >= fu_dt:
                    follow_ups_due.append(row)

    if follow_ups_due:
        names = ", ".join(f"{r.get('clinic_name')} ({r.get('city','')})" for r in follow_ups_due[:5])
        request_decision(
            AGENT_ID,
            f"⏰ follow-up נדרש — {len(follow_ups_due)} קליניקות",
            f"הקליניקות הבאות לא ענו תוך {FOLLOW_UP_DAYS} ימים:\n{names}\n\n"
            f"תבנית C מ-DM_templates.md מוכנה לשימוש.\n"
            f"אשר → VP Sales ישלח תזכורת ב-Inbox לכל אחת.",
            risk_tier="low",
        )

    total = len(rows)
    sent = status_count.get("sent", 0)
    replied = status_count.get("replied", 0)
    meeting = status_count.get("meeting", 0)
    won = status_count.get("closed_won", 0)

    conversion = f"{won}/{total}" if total > 0 else "0"
    reply_rate = f"{round(replied/sent*100)}%" if sent > 0 else "—"

    return (
        f"קמפיין 50 קליניקות: {total} סה\"כ | {sent} נשלח | {replied} ענו ({reply_rate}) | "
        f"{meeting} פגישה | {won} סגור ✅\n"
        f"follow-up ממתינים: {len(follow_ups_due)}"
    )


# ── Daily run ──────────────────────────────────────────────────────────────

def run_once():
    logger.info("💼 VP Sales — checking pipeline")
    today = str(date.today())

    leads = lead_tracker_fetch()
    conversion = conversion_analyzer_report(leads)
    outreach = clinic_outreach_run()
    open_issues = support_agent_check()

    issues_text = "\n".join(f"  {i}" for i in open_issues) if open_issues else "  אין בעיות פתוחות ✅"

    body = (
        f"דוח VP Sales — {today}\n\n"
        f"M.D Clinic — קמפיין 50 קליניקות:\n  {outreach}\n\n"
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
