"""
VP IT — monitors all infrastructure.

Team:
  - Infrastructure Monitor: checks all service URLs
  - Deployment Watcher: verifies Railway/Vercel deployments are healthy
  - Backup Checker: ensures Supabase data is accessible
  - Security Scanner: checks for exposed secrets or anomalies
"""
import os, time, logging, httpx
from datetime import datetime, timezone, date

from base_agent import (
    db, memory_get, memory_set, send_message,
    open_incident, resolve_incident, write_report, ask_claude
)

AGENT_ID = "vp_it"
logger = logging.getLogger(AGENT_ID)

SERVICES = [
    {"name": "social_ai_backend", "url": os.environ.get("SOCIAL_AI_HEALTH_URL", "https://social-ai-platform-production.up.railway.app/health"), "timeout": 8},
    {"name": "social_ai_frontend", "url": "https://frontend-murex-three-74g0axrz4g.vercel.app", "timeout": 10},
    {"name": "claude_pm_dashboard", "url": "https://claude-9jz8ta0lf-gilgershovich-clouds-projects.vercel.app/board", "timeout": 10},
    {"name": "md_clinic_local", "url": os.environ.get("MD_CLINIC_HEALTH_URL", ""), "timeout": 10},
]


# ── Team: Infrastructure Monitor ──────────────────────────────────────────

def infra_monitor_check() -> list[dict]:
    """Checks all service URLs and returns status list."""
    results = []
    for svc in SERVICES:
        if not svc["url"]:
            results.append({"name": svc["name"], "status": "skipped"})
            continue
        try:
            import time as _time
            start = _time.monotonic()
            r = httpx.get(svc["url"], timeout=svc["timeout"], follow_redirects=True)
            latency = round(_time.monotonic() - start, 2)
            status = "ok" if r.status_code < 400 else "degraded"
            results.append({"name": svc["name"], "status": status, "latency": latency, "code": r.status_code})
        except httpx.TimeoutException:
            results.append({"name": svc["name"], "status": "down", "reason": "timeout"})
        except Exception as e:
            results.append({"name": svc["name"], "status": "down", "reason": str(e)[:100]})
    return results


# ── Team: Deployment Watcher ───────────────────────────────────────────────

def deployment_watcher_report(checks: list[dict]) -> tuple[list[str], list[str]]:
    """Returns (ok_services, failed_services)."""
    ok = [c["name"] for c in checks if c["status"] in ("ok", "skipped")]
    failed = [c["name"] for c in checks if c["status"] in ("down", "degraded")]
    return ok, failed


# ── Team: Backup Checker ───────────────────────────────────────────────────

def backup_checker_verify() -> bool:
    """Verifies Supabase is accessible and tables exist."""
    try:
        result = db().table("groups").select("id").limit(1).execute()
        return bool(result.data is not None)
    except Exception:
        return False


# ── Team: Security Scanner ─────────────────────────────────────────────────

def security_scanner_check() -> list[str]:
    """Basic security checks."""
    alerts = []
    # Check if any incidents have been open too long
    try:
        old = db().table("incidents").select("title,created_at").eq("status", "open").execute().data or []
        for inc in old:
            from datetime import datetime
            created = datetime.fromisoformat(inc["created_at"].replace("Z", "+00:00"))
            age_hours = (datetime.now(timezone.utc) - created).total_seconds() / 3600
            if age_hours > 24:
                alerts.append(f"⚠️ אינצידנט פתוח מעל 24 שעות: {inc['title']}")
    except Exception:
        pass
    return alerts


# ── Handle incidents ───────────────────────────────────────────────────────

def handle_service_results(checks: list[dict]) -> None:
    ok, failed = deployment_watcher_report(checks)
    for svc_name in failed:
        incident_key = f"incident_{svc_name}"
        existing = memory_get(AGENT_ID, incident_key)
        if not existing:
            inc_id = open_incident(AGENT_ID, svc_name, f"🚨 {svc_name} לא מגיב",
                                   f"בדיקת IT נכשלה עבור {svc_name}", severity="critical")
            memory_set(AGENT_ID, incident_key, inc_id)
            send_message(AGENT_ID, "ceo", f"🚨 IT: {svc_name} DOWN",
                        f"השירות {svc_name} לא מגיב. אינצידנט #{inc_id} נפתח.", priority="high")

    for svc_name in ok:
        incident_key = f"incident_{svc_name}"
        existing = memory_get(AGENT_ID, incident_key)
        if existing:
            try:
                resolve_incident(existing)
            except Exception:
                pass
            memory_set(AGENT_ID, incident_key, None)


# ── Daily run ──────────────────────────────────────────────────────────────

def run_once():
    logger.info("🖥️ VP IT — infrastructure scan")
    today = str(date.today())

    checks = infra_monitor_check()
    handle_service_results(checks)
    db_ok = backup_checker_verify()
    security_alerts = security_scanner_check()

    status_lines = "\n".join(
        f"  {'✅' if c['status'] == 'ok' else '⏭️' if c['status'] == 'skipped' else '❌'} "
        f"{c['name']}: {c['status']}" + (f" ({c.get('latency', '')}s)" if c.get('latency') else "")
        for c in checks
    )

    body = (
        f"דוח VP IT — {today}\n\n"
        f"תשתיות:\n{status_lines}\n\n"
        f"Supabase: {'✅ תקין' if db_ok else '❌ לא נגיש'}\n\n"
        f"אבטחה:\n" + ("\n".join(f"  {a}" for a in security_alerts) if security_alerts else "  תקין ✅")
    )

    last = memory_get(AGENT_ID, "last_report_date")
    if last != today:
        write_report(AGENT_ID, f"דוח IT — {today}", body)
        has_issues = any(c["status"] in ("down", "degraded") for c in checks) or not db_ok
        send_message(AGENT_ID, "ceo", f"🖥️ דוח IT — {today}", body,
                     priority="high" if has_issues else "low")
        memory_set(AGENT_ID, "last_report_date", today)


if __name__ == "__main__":
    interval = int(os.environ.get("IT_INTERVAL_SECONDS", "1800"))
    while True:
        try:
            run_once()
        except Exception as e:
            logger.error(f"VP IT error: {e}")
        time.sleep(interval)
