"""
CEO Agent — runs every evening, reads all company data,
writes a daily digest to Gil's inbox, and escalates critical items.
"""
import os
import time
import logging
from datetime import datetime, timezone, timedelta

from base_agent import (
    memory_get, memory_set, send_message,
    get_open_incidents, get_today_reports,
    get_pending_decisions, request_decision, ask_claude, db,
    send_whatsapp_to_gil
)

AGENT_ID = "ceo"
logger = logging.getLogger(AGENT_ID)

COMPANY_NAME = os.environ.get("COMPANY_NAME", "AI Company OS")


# ── Build digest ───────────────────────────────────────────────────────────

def build_daily_digest() -> tuple[str, str, str]:
    """Returns (subject, body, priority)."""
    date_str = datetime.now(timezone.utc).strftime("%d/%m/%Y")
    incidents = get_open_incidents()
    reports = get_today_reports()
    pending = get_pending_decisions()

    # Severity counts
    critical = [i for i in incidents if i["severity"] == "critical"]
    high = [i for i in incidents if i["severity"] == "high"]
    overall = "🔴 קריטי" if critical else "🟡 אזהרה" if high else "🟢 תקין"

    # Incidents section
    if incidents:
        inc_lines = "\n".join(
            f"  [{i['severity'].upper()}] {i['project']} — {i['title']}"
            for i in incidents[:10]
        )
        inc_section = f"🚨 אינצידנטים פתוחים ({len(incidents)}):\n{inc_lines}"
    else:
        inc_section = "✅ אין אינצידנטים פתוחים"

    # Reports section
    if reports:
        rep_lines = "\n".join(f"  📋 [{r['agent_id']}] {r['title']}" for r in reports[:5])
        rep_section = f"דוחות היום ({len(reports)}):\n{rep_lines}"
    else:
        rep_section = "אין דוחות היום"

    # Decisions section
    if pending:
        dec_lines = "\n".join(
            f"  ⚖️ [{d['risk_tier'].upper()}] {d['title']}"
            for d in pending[:5]
        )
        dec_section = f"⚖️ החלטות ממתינות לאישורך ({len(pending)}):\n{dec_lines}\n👉 https://claude-9jz8ta0lf-gilgershovich-clouds-projects.vercel.app/inbox"
    else:
        dec_section = "אין החלטות ממתינות ✅"

    # Ask Claude for a one-line insight
    try:
        insight = ask_claude(
            system=(
                f"אתה מנכ\"ל של {COMPANY_NAME} — חברה שבונה מוצרי AI. "
                "כתוב משפט אחד קצר ואופטימי על מצב החברה בעברית."
            ),
            user=f"מצב: {overall}. אינצידנטים: {len(incidents)}. דוחות: {len(reports)}. החלטות ממתינות: {len(pending)}.",
            max_tokens=80,
        )
    except Exception:
        insight = "המשך בנייה. כל פרויקט צעד קדימה."

    body = (
        f"שלום גיל,\n\n"
        f"מצב החברה: {overall}\n"
        f"💡 {insight}\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"{inc_section}\n\n"
        f"{rep_section}\n\n"
        f"{dec_section}\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"📊 Dashboard: https://claude-9jz8ta0lf-gilgershovich-clouds-projects.vercel.app/board\n"
        f"📬 Inbox: https://claude-9jz8ta0lf-gilgershovich-clouds-projects.vercel.app/inbox\n\n"
        f"— מנכ\"ל, {COMPANY_NAME}"
    )

    priority = "high" if critical else "medium" if (high or pending) else "low"
    subject = f"{'🚨' if critical else '📊'} דוח יומי — {date_str} — {overall}"

    return subject, body, priority


# ── Project lifecycle check ────────────────────────────────────────────────

def check_project_lifecycle() -> None:
    """
    בודק פרויקטים שסיימו פיתוח ומוכנים לאישור גיל.
    כל פרויקט שכל הפריטים שלו 'done' → מציע מעבר ל-live_managed.
    """
    groups = db().table("groups").select("id,name,lifecycle_status").eq("lifecycle_status", "development").execute().data
    for group in groups:
        items = db().table("items").select("status").eq("group_id", group["id"]).execute().data
        if not items:
            continue
        total = len(items)
        done = sum(1 for i in items if i["status"] == "done")
        pct = (done / total) * 100

        if pct >= 85:
            request_decision(
                AGENT_ID,
                f"🚀 {group['name']} — מוכן לעלות לאוויר?",
                f"הפרויקט {group['name']} הושלם ב-{pct:.0f}% ({done}/{total} פריטים 'done').\n"
                f"לאחר אישורך הפרויקט יועבר לניהול אוטונומי של החברה.",
                risk_tier="high"
            )
            logger.info(f"Decision requested for {group['name']} ({pct:.0f}% done)")


# ── Approve lifecycle (called when Gil approves decision) ──────────────────

def promote_project_to_live(group_id: str) -> None:
    db().table("groups").update({"lifecycle_status": "live_managed"}).eq("id", group_id).execute()
    send_message(
        AGENT_ID, "gil",
        "✅ פרויקט עלה לניהול אוטונומי",
        f"הפרויקט הועבר בהצלחה לשלב live_managed. VP Engineering יתחיל לנטר אותו.",
        priority="medium"
    )


# ── WhatsApp summary ──────────────────────────────────────────────────────

def _build_whatsapp_summary(subject: str, full_body: str) -> str:
    """Builds a concise WhatsApp message from the full digest."""
    incidents = get_open_incidents()
    pending = get_pending_decisions()
    critical = [i for i in incidents if i["severity"] == "critical"]
    overall = "🔴" if critical else "🟡" if incidents else "🟢"

    lines = [
        f"*{COMPANY_NAME} — דוח יומי*",
        f"מצב: {overall}",
    ]
    if critical:
        lines.append(f"🚨 {len(critical)} אינצידנטים קריטיים")
    if pending:
        lines.append(f"⚖️ {len(pending)} החלטות ממתינות לאישורך")
    lines.append(f"📊 Dashboard: https://claude-9jz8ta0lf-gilgershovich-clouds-projects.vercel.app/inbox")

    return "\n".join(lines)


# ── Main ───────────────────────────────────────────────────────────────────

def run_once() -> None:
    logger.info("🏢 CEO agent — starting daily run")

    # שלח דוח יומי פעם אחת ביום
    today = str(datetime.now(timezone.utc).date())
    last_digest = memory_get(AGENT_ID, "last_digest_date")

    if last_digest != today:
        subject, body, priority = build_daily_digest()

        # Inbox (Claude PM)
        send_message(AGENT_ID, "gil", subject, body, priority)

        # WhatsApp — גרסה קצרה
        wa_msg = _build_whatsapp_summary(subject, body)
        sent = send_whatsapp_to_gil(wa_msg)
        if not sent:
            logger.info("WhatsApp bridge not available — digest sent to inbox only")

        memory_set(AGENT_ID, "last_digest_date", today)
        logger.info(f"📨 Daily digest sent: {subject}")

    # בדוק lifecycle של פרויקטים
    try:
        check_project_lifecycle()
    except Exception as e:
        logger.error(f"Lifecycle check failed: {e}")


if __name__ == "__main__":
    # ריצה כל ערב בשעה 21:00 UTC (22:00 ישראל)
    RUN_HOUR_UTC = int(os.environ.get("CEO_RUN_HOUR_UTC", "19"))
    CHECK_INTERVAL = 1800  # בדוק כל 30 דקות אם הגיע הזמן

    logger.info(f"CEO agent starting — will run daily at {RUN_HOUR_UTC}:00 UTC")

    while True:
        try:
            hour = datetime.now(timezone.utc).hour
            if hour >= RUN_HOUR_UTC:
                run_once()
        except Exception as e:
            logger.error(f"CEO run error: {e}")
        time.sleep(CHECK_INTERVAL)