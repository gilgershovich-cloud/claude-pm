"""
VP Projects — manages all projects in Claude PM.

Team:
  - Board Watcher: monitors item statuses, detects stale items
  - Progress Tracker: calculates completion %, flags blockers
  - Sprint Planner: suggests next actions based on project state
"""
import os, time, json, logging
from datetime import datetime, timezone, date

from base_agent import (
    db, memory_get, memory_set, send_message,
    open_incident, write_report, request_decision, ask_claude
)

AGENT_ID = "vp_projects"
logger = logging.getLogger(AGENT_ID)


# ── Team: Board Watcher ────────────────────────────────────────────────────

def board_watcher_scan() -> dict:
    """Scans all groups and items, returns project health report."""
    r = db().table("groups").select("id,name,lifecycle_status,color").order("position").execute()
    groups = r.data if r and r.data else []
    report = {}
    for group in groups:
        ri = db().table("items").select("id,name,status,updated_at").eq("group_id", group["id"]).execute()
        items = ri.data if ri and ri.data else []
        total = len(items)
        if total == 0:
            continue
        done = sum(1 for i in items if i["status"] == "done")
        blocked = sum(1 for i in items if i["status"] == "blocked")
        active = sum(1 for i in items if i["status"] in ("active", "working_on_it"))
        pct = round((done / total) * 100)

        report[group["name"]] = {
            "lifecycle": group.get("lifecycle_status", "development"),
            "total": total, "done": done, "blocked": blocked,
            "active": active, "pct": pct,
        }
    return report


# ── Team: Progress Tracker ─────────────────────────────────────────────────

def progress_tracker_check(board: dict) -> list[str]:
    """Returns list of alerts: blocked items, stale projects."""
    alerts = []
    for name, data in board.items():
        if data["blocked"] > 0:
            alerts.append(f"🔴 {name}: {data['blocked']} פריטים חסומים")
        if data["pct"] >= 85 and data["lifecycle"] == "development":
            alerts.append(f"🚀 {name}: {data['pct']}% הושלם — מוכן לאישור גיל?")
    return alerts


# ── Team: Sprint Planner ───────────────────────────────────────────────────

def sprint_planner_suggest(board: dict) -> str:
    """Uses Claude to suggest next actions across all projects."""
    summary = "\n".join(
        f"- {name}: {d['pct']}% done, {d['active']} active, {d['blocked']} blocked, lifecycle={d['lifecycle']}"
        for name, d in board.items()
    )
    return ask_claude(
        system="אתה VP ניהול פרויקטים. תן 3 המלצות קצרות לשבוע הקרוב בעברית. משפט אחד לכל המלצה.",
        user=f"מצב הפרויקטים:\n{summary}",
        max_tokens=200,
    )


# ── Daily run ──────────────────────────────────────────────────────────────

def run_once():
    logger.info("📋 VP Projects — scanning board")
    today = str(date.today())

    board = board_watcher_scan()
    alerts = progress_tracker_check(board)

    try:
        suggestions = sprint_planner_suggest(board)
    except Exception:
        suggestions = "לא ניתן לייצר המלצות כרגע."

    # Build report
    board_lines = "\n".join(
        f"  {'✅' if d['pct']==100 else '🔄'} {name}: {d['pct']}% ({d['done']}/{d['total']}) [{d['lifecycle']}]"
        for name, d in board.items()
    )
    alert_lines = "\n".join(f"  {a}" for a in alerts) if alerts else "  אין חסימות ✅"

    body = (
        f"דוח VP Projects — {today}\n\n"
        f"מצב פרויקטים:\n{board_lines}\n\n"
        f"התראות:\n{alert_lines}\n\n"
        f"המלצות השבוע:\n{suggestions}"
    )

    last = memory_get(AGENT_ID, "last_report_date")
    if last != today:
        write_report(AGENT_ID, f"דוח פרויקטים — {today}", body)
        send_message(AGENT_ID, "ceo", f"📋 דוח פרויקטים — {today}", body,
                     priority="high" if alerts else "low")
        memory_set(AGENT_ID, "last_report_date", today)

    # Escalate blocked items
    for alert in alerts:
        if "חסומים" in alert:
            send_message(AGENT_ID, "ceo", f"🔴 חסימה: {alert}", alert, priority="high")


if __name__ == "__main__":
    interval = int(os.environ.get("PROJECTS_INTERVAL_SECONDS", "3600"))
    while True:
        try:
            run_once()
        except Exception as e:
            logger.error(f"VP Projects error: {e}")
        time.sleep(interval)
