"""
Entry point for Railway — runs VP Engineering + CEO in parallel threads.
"""
import threading
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import vp_engineering
import ceo
import vp_marketing

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s"
)
logger = logging.getLogger("company_os")


def run_vp():
    interval = int(os.environ.get("CHECK_INTERVAL_SECONDS", "3600"))
    logger.info(f"VP Engineering thread started (interval: {interval}s)")
    import time
    while True:
        try:
            vp_engineering.run_once()
        except Exception as e:
            logger.error(f"VP Engineering error: {e}")
        time.sleep(interval)


def run_ceo():
    import time
    run_hour = int(os.environ.get("CEO_RUN_HOUR_UTC", "19"))
    logger.info(f"CEO thread started (runs daily at {run_hour}:00 UTC)")
    while True:
        try:
            ceo.run_once()
        except Exception as e:
            logger.error(f"CEO error: {e}")
        time.sleep(1800)  # check every 30 min


def run_marketing():
    import time
    interval = int(os.environ.get("MARKETING_INTERVAL_SECONDS", "3600"))
    logger.info(f"VP Marketing thread started (interval: {interval}s)")
    while True:
        try:
            vp_marketing.run_once()
        except Exception as e:
            logger.error(f"VP Marketing error: {e}")
        time.sleep(interval)


if __name__ == "__main__":
    logger.info("🏢 AI Company OS — agents starting")

    threads = [
        threading.Thread(target=run_vp,        daemon=True, name="vp_engineering"),
        threading.Thread(target=run_ceo,        daemon=True, name="ceo"),
        threading.Thread(target=run_marketing,  daemon=True, name="vp_marketing"),
    ]

    for t in threads:
        t.start()

    for t in threads:
        t.join()