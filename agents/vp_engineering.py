"""
VP Engineering Agent — monitors all live products every hour.
Reports incidents + writes daily status reports.

Products monitored:
  - Social AI Platform (Railway)
  - M.D Clinic (Cloudflare Tunnel, once deployed)
"""
import os
import time
import logging
import httpx
from datetime import datetime, timezone

from base_agent import (
    memory_get, memory_set, send_message,
    open_incident, resolve_incident, get_open_incidents,
    write_report, request_decision, ask_claude
)

AGENT_ID = "vp_engineering"
logger = logging.getLogger(AGENT_ID)

# ── Products to monitor ────────────────────────────────────────────────────

PRODUCTS = [
    {
        "name": "social_ai_platform",
        "display": "Social AI Platform",
        "health_url": os.environ.get("SOCIAL_AI_HEALTH_URL", "https://social-ai-platform-production.up.railway.app/health"),
        "timeout": 8,
    },
    {
        "name": "md_clinic",
        "display": "M.D Clinic",
        "health_url": os.environ.get("MD_CLINIC_HEALTH_URL", ""),  # מוגדר אחרי Cloudflare Tunnel
        "timeout": 10,
    },
]

SLOW_THRESHOLD_SEC = 3.0   # מעל → אזהרה
DOWN_THRESHOLD_SEC = 8.0   # timeout → קריטי


# ── Health check ───────────────────────────────────────────────────────────

def check_health(product: dict) -> dict:
    url = product["health_url"]
    if not url:
        return {"status": "skipped", "reason": "no URL configured"}

    try:
        start = time.monotonic()
        resp = httpx.get(url, timeout=product["timeout"])
        elapsed = time.monotonic() - start

        if resp.status_code == 200:
            return {"status": "ok", "latency": round(elapsed, 2), "code": 200}
        else:
            return {"status": "error", "code": resp.status_code, "latency": round(elapsed, 2)}

    except httpx.TimeoutException:
        return {"status": "down", "reason": "timeout"}
    except Exception as e:
        return {"status": "down", "reason": str(e)[:200]}


# ── Handle single product ──────────────────────────────────────────────────

def handle_product(product: dict) -> None:
    name = product["name"]
    display = product["display"]
    result = check_health(product)
    status = result["status"]

    # מפתח לזיכרון: האינצידנט הפתוח האחרון
    incident_key = f"open_incident_{name}"

    if status == "skipped":
        return

    elif status == "ok":
        latency = result.get("latency", 0)
        logger.info(f"✅ {display} — {latency}s")

        # סגור אינצידנט פתוח אם היה
        open_id = memory_get(AGENT_ID, incident_key)
        if open_id:
            try:
                resolve_incident(open_id)
                memory_set(AGENT_ID, incident_key, None)
                send_message(
                    AGENT_ID, "ceo",
                    f"✅ {display} — חזר לפעולה",
                    f"השירות {display} חזר לפעילות תקינה (latency: {latency}s).",
                    priority="medium"
                )
            except Exception as e:
                logger.warning(f"Failed to resolve incident: {e}")

        # אזהרת ביצועים
        if latency > SLOW_THRESHOLD_SEC:
            open_incident(
                AGENT_ID, name,
                f"⚠️ {display} — תגובה איטית",
                f"Health check לקח {latency}s (סף: {SLOW_THRESHOLD_SEC}s).",
                severity="low"
            )

    elif status in ("error", "down"):
        reason = result.get("reason") or f"HTTP {result.get('code')}"
        logger.error(f"❌ {display} — {reason}")

        # פתח אינצידנט אם אין כבר פתוח
        open_id = memory_get(AGENT_ID, incident_key)
        if not open_id:
            incident_id = open_incident(
                AGENT_ID, name,
                f"🚨 {display} DOWN",
                f"Health check נכשל: {reason}",
                severity="critical"
            )
            memory_set(AGENT_ID, incident_key, incident_id)

            # שלח למנכ"ל + בקש החלטה אם זה ממושך
            send_message(
                AGENT_ID, "ceo",
                f"🚨 {display} DOWN — דרוש טיפול",
                f"השירות {display} לא מגיב.\nסיבה: {reason}\n\n"
                f"בדוק: {product['health_url']}\n"
                f"אינצידנט #{incident_id} נפתח.",
                priority="high"
            )


# ── Daily report ───────────────────────────────────────────────────────────

def write_daily_report() -> None:
    open_incidents = get_open_incidents()
    incident_summary = "\n".join(
        f"  [{i['severity'].upper()}] {i['project']} — {i['title']}"
        for i in open_incidents
    ) or "  אין אינצידנטים פתוחים ✅"

    products_status = []
    for p in PRODUCTS:
        if not p["health_url"]:
            products_status.append(f"  {p['display']}: לא מוגדר עדיין")
            continue
        result = check_health(p)
        emoji = "✅" if result["status"] == "ok" else "❌"
        latency = f" ({result.get('latency', '?')}s)" if result.get("latency") else ""
        products_status.append(f"  {emoji} {p['display']}{latency}")

    body = (
        f"דוח VP Engineering — {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M UTC')}\n\n"
        f"סטטוס שירותים:\n" + "\n".join(products_status) +
        f"\n\nאינצידנטים פתוחים ({len(open_incidents)}):\n{incident_summary}"
    )

    write_report(AGENT_ID, f"דוח Engineering — {datetime.now(timezone.utc).date()}", body)
    logger.info("📋 Daily report written")


# ── Main loop ──────────────────────────────────────────────────────────────

def run_once() -> None:
    logger.info("🔍 VP Engineering — starting health checks")
    for product in PRODUCTS:
        try:
            handle_product(product)
        except Exception as e:
            logger.error(f"Error handling {product['name']}: {e}")

    # כתוב דוח יומי בשעה 7 בבוקר UTC
    hour = datetime.now(timezone.utc).hour
    last_report_date = memory_get(AGENT_ID, "last_report_date")
    today = str(datetime.now(timezone.utc).date())
    if hour >= 7 and last_report_date != today:
        write_daily_report()
        memory_set(AGENT_ID, "last_report_date", today)


if __name__ == "__main__":
    interval = int(os.environ.get("CHECK_INTERVAL_SECONDS", "3600"))  # ברירת מחדל: שעה
    logger.info(f"VP Engineering starting — interval: {interval}s")

    while True:
        try:
            run_once()
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
        time.sleep(interval)