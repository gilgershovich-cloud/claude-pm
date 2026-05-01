"""
AI Company OS — Entry point for Railway.
Runs CEO + 7 VP agents in parallel threads.

Hierarchy:
  CEO (daily digest + lifecycle decisions)
    ├── VP Engineering  (health checks, incidents)
    ├── VP Marketing    (campaigns, proposals, analytics)
    ├── VP Projects     (board tracking, sprint planning)
    ├── VP Sales        (leads, conversions, support)
    ├── VP Finance      (costs, revenue, P&L)
    ├── VP IT           (infrastructure, security)
    └── VP HR           (agent performance, team health)
"""
import threading, logging, os, sys, time
sys.path.insert(0, os.path.dirname(__file__))

import ceo, vp_engineering, vp_marketing, vp_projects, vp_sales, vp_finance, vp_it, vp_hr

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s"
)
logger = logging.getLogger("company_os")


def _loop(agent_module, interval_env: str, default_interval: int, name: str):
    interval = int(os.environ.get(interval_env, str(default_interval)))
    logger.info(f"{name} thread started (interval: {interval}s)")
    while True:
        try:
            agent_module.run_once()
        except Exception as e:
            logger.error(f"{name} error: {e}")
        time.sleep(interval)


def run_ceo():
    run_hour = int(os.environ.get("CEO_RUN_HOUR_UTC", "19"))
    logger.info(f"CEO thread started (runs daily at {run_hour}:00 UTC)")
    while True:
        try:
            ceo.run_once()
        except Exception as e:
            logger.error(f"CEO error: {e}")
        time.sleep(1800)


if __name__ == "__main__":
    logger.info("🏢 AI Company OS — starting (CEO + 7 VPs)")

    threads = [
        threading.Thread(target=run_ceo,    daemon=True, name="ceo"),
        threading.Thread(target=_loop, args=(vp_engineering, "CHECK_INTERVAL_SECONDS",    3600, "VP Engineering"), daemon=True),
        threading.Thread(target=_loop, args=(vp_marketing,   "MARKETING_INTERVAL_SECONDS", 3600, "VP Marketing"),   daemon=True),
        threading.Thread(target=_loop, args=(vp_projects,    "PROJECTS_INTERVAL_SECONDS",  3600, "VP Projects"),    daemon=True),
        threading.Thread(target=_loop, args=(vp_sales,       "SALES_INTERVAL_SECONDS",     3600, "VP Sales"),       daemon=True),
        threading.Thread(target=_loop, args=(vp_finance,     "FINANCE_INTERVAL_SECONDS",   3600, "VP Finance"),     daemon=True),
        threading.Thread(target=_loop, args=(vp_it,          "IT_INTERVAL_SECONDS",        1800, "VP IT"),          daemon=True),
        threading.Thread(target=_loop, args=(vp_hr,          "HR_INTERVAL_SECONDS",        3600, "VP HR"),          daemon=True),
    ]

    for t in threads:
        t.start()
        logger.info(f"  ✅ {t.name} started")

    logger.info("🏢 All agents running. Company is autonomous.")

    for t in threads:
        t.join()
