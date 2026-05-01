"""
VP HR — manages the agent team.

Team:
  - Performance Tracker: monitors agent health and error rates
  - Team Reporter: generates weekly team status
  - Onboarding Manager: detects new agents needed, reports to CEO
  - Agent Health Monitor: detects agents that stopped reporting
"""
import os, time, logging
from datetime import datetime, timezone, date, timedelta

from base_agent import (
    db, memory_get, memory_set, send_message,
    write_report, request_decision, ask_claude
)

AGENT_ID = "vp_hr"
logger = logging.getLogger(AGENT_ID)

ALL_AGENTS = [
    {"id": "ceo",            "name": "מנכ\"ל",           "tier": "executive"},
    {"id": "vp_engineering", "name": "VP Engineering",   "tier": "vp"},
    {"id": "vp_marketing",   "name": "VP Marketing",     "tier": "vp"},
    {"id": "vp_projects",    "name": "VP Projects",      "tier": "vp"},
    {"id": "vp_sales",       "name": "VP Sales",         "tier": "vp"},
    {"id": "vp_finance",     "name": "VP Finance",       "tier": "vp"},
    {"id": "vp_it",          "name": "VP IT",            "tier": "vp"},
    {"id": "vp_hr",          "name": "VP HR",            "tier": "vp"},
]


# ── Team: Performance Tracker ──────────────────────────────────────────────

def performance_tracker_scan() -> list[dict]:
    """Checks each agent's last report date and incident rate."""
    results = []
    today = date.today()
    yesterday = (today - timedelta(days=1)).isoformat()
    today_str = today.isoformat()

    for agent in ALL_AGENTS:
        # Check last report
        reports = db().table("agent_reports").select("created_at") \
            .eq("agent_id", agent["id"]).order("created_at", desc=True).limit(1).execute().data or []

        last_report = reports[0]["created_at"][:10] if reports else "לא דיווח"
        active = last_report >= yesterday if last_report != "לא דיווח" else False

        # Error count from incidents
        incidents = db().table("incidents").select("id").eq("agent_id", agent["id"]) \
            .eq("status", "open").execute().data or []

        results.append({
            "id": agent["id"],
            "name": agent["name"],
            "active": active,
            "last_report": last_report,
            "open_incidents": len(incidents),
        })

    return results


# ── Team: Team Reporter ────────────────────────────────────────────────────

def team_reporter_generate(performance: list[dict]) -> str:
    active_count = sum(1 for a in performance if a["active"])
    inactive = [a for a in performance if not a["active"]]

    lines = []
    for a in performance:
        icon = "✅" if a["active"] else "⚠️"
        lines.append(f"  {icon} {a['name']}: דוח אחרון {a['last_report']}, אינצידנטים: {a['open_incidents']}")

    summary = f"סוכנים פעילים: {active_count}/{len(performance)}"
    if inactive:
        summary += f"\nסוכנים לא פעילים: {', '.join(a['name'] for a in inactive)}"

    return f"{summary}\n\n" + "\n".join(lines)


# ── Team: Onboarding Manager ───────────────────────────────────────────────

def onboarding_manager_check() -> None:
    """Detects if new VP agents are needed based on workload."""
    # Check if VP Finance has no revenue data yet — suggest action
    finance_reports = db().table("agent_reports").select("id").eq("agent_id", "vp_finance").execute().data or []
    if not finance_reports:
        send_message(AGENT_ID, "ceo",
            "📌 VP Finance לא דיווח עדיין",
            "VP Finance טרם שלח דוח. ייתכן שצריך לוודא שהוא מוגדר נכון.",
            priority="low")


# ── Team: Agent Health Monitor ─────────────────────────────────────────────

def agent_health_monitor(performance: list[dict]) -> list[str]:
    """Alerts on agents that haven't reported in over 24 hours."""
    alerts = []
    for a in performance:
        if not a["active"] and a["id"] != AGENT_ID:  # don't alert about self
            alerts.append(f"⚠️ {a['name']} לא דיווח ב-24 שעות האחרונות")
    return alerts


# ── Daily run ──────────────────────────────────────────────────────────────

def run_once():
    logger.info("👥 VP HR — team scan")
    today = str(date.today())

    performance = performance_tracker_scan()
    team_report = team_reporter_generate(performance)
    health_alerts = agent_health_monitor(performance)

    alert_text = "\n".join(f"  {a}" for a in health_alerts) if health_alerts else "  כל הסוכנים פעילים ✅"
    body = f"דוח VP HR — {today}\n\n{team_report}\n\nהתראות:\n{alert_text}"

    last = memory_get(AGENT_ID, "last_report_date")
    if last != today:
        write_report(AGENT_ID, f"דוח HR — {today}", body)
        send_message(AGENT_ID, "ceo", f"👥 דוח HR — {today}", body,
                     priority="high" if health_alerts else "low")
        memory_set(AGENT_ID, "last_report_date", today)
        onboarding_manager_check()


if __name__ == "__main__":
    interval = int(os.environ.get("HR_INTERVAL_SECONDS", "3600"))
    while True:
        try:
            run_once()
        except Exception as e:
            logger.error(f"VP HR error: {e}")
        time.sleep(interval)
