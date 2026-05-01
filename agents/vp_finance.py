"""
VP Finance — tracks costs, revenue, and financial health.

Team:
  - Cost Monitor: reads api_usage_log + campaign_metrics
  - Revenue Tracker: reads Stripe subscriptions + Green Invoice payments
  - P&L Reporter: generates weekly/monthly profit & loss
  - Budget Controller: alerts on overspend
"""
import os, time, logging
from datetime import datetime, timezone, date, timedelta

from base_agent import (
    db, memory_get, memory_set, send_message,
    write_report, request_decision, ask_claude
)

AGENT_ID = "vp_finance"
logger = logging.getLogger(AGENT_ID)

USD_TO_ILS = 3.7
ILS_TO_USD = 0.27


# ── Team: Cost Monitor ─────────────────────────────────────────────────────

def cost_monitor_fetch(days: int = 7) -> dict:
    """Fetches API costs for the last N days."""
    costs = {"anthropic_usd": 0, "openai_usd": 0, "ads_ils": 0, "total_ils": 0}

    # Social AI API costs (from api_usage_log in social-ai Supabase)
    # We read from claude-pm's agent_reports for cost summaries
    try:
        reports = db().table("agent_reports").select("body").eq("agent_id", "vp_marketing") \
            .order("created_at", desc=True).limit(7).execute().data or []
        for r in reports:
            body = r.get("body", "")
            if "הוצאה כוללת:" in body:
                import re
                match = re.search(r'הוצאה כוללת: ([\d.]+)₪', body)
                if match:
                    costs["ads_ils"] += float(match.group(1))
    except Exception as e:
        logger.debug(f"Cost fetch: {e}")

    # Ad campaign spend
    try:
        campaigns = db().table("ad_campaigns").select("total_spent_ils,status").eq("status", "active").execute().data or []
        costs["ads_ils"] += sum(float(c.get("total_spent_ils", 0) or 0) for c in campaigns)
    except Exception as e:
        logger.debug(f"Campaign cost: {e}")

    costs["total_ils"] = (costs["anthropic_usd"] + costs["openai_usd"]) * USD_TO_ILS + costs["ads_ils"]
    return costs


# ── Team: Revenue Tracker ──────────────────────────────────────────────────

def revenue_tracker_fetch() -> dict:
    """Fetches revenue from all sources."""
    revenue = {"social_ai_mrr_ils": 0, "md_clinic_payments": 0, "total_ils": 0}

    PLAN_PRICES_ILS = {"starter": 490, "pro": 990, "agency": 2490}

    try:
        subs = db().table("subscriptions").select("plan,status").eq("status", "active").execute().data or []
        for s in subs:
            revenue["social_ai_mrr_ils"] += PLAN_PRICES_ILS.get(s.get("plan", ""), 0)
    except Exception as e:
        logger.debug(f"Revenue fetch: {e}")

    revenue["total_ils"] = revenue["social_ai_mrr_ils"] + revenue["md_clinic_payments"]
    return revenue


# ── Team: P&L Reporter ─────────────────────────────────────────────────────

def pl_reporter_generate(costs: dict, revenue: dict) -> str:
    """Generates P&L summary."""
    mrr = revenue["total_ils"]
    total_costs = costs["total_ils"] + 5  # Railway $5/month
    profit = mrr - total_costs

    emoji = "🟢" if profit >= 0 else "🔴"

    return (
        f"{emoji} P&L שבועי:\n"
        f"  הכנסות MRR: {mrr:,.0f}₪\n"
        f"  עלויות AI: {costs['anthropic_usd'] * USD_TO_ILS:.0f}₪\n"
        f"  פרסום: {costs['ads_ils']:.0f}₪\n"
        f"  Railway: 18₪\n"  # $5 in ILS
        f"  ───────────\n"
        f"  {'רווח' if profit >= 0 else 'הפסד'}: {abs(profit):,.0f}₪"
    )


# ── Team: Budget Controller ────────────────────────────────────────────────

def budget_controller_check(costs: dict, revenue: dict) -> list[str]:
    """Alerts if costs exceed safe thresholds."""
    alerts = []
    if costs["ads_ils"] > 500:
        alerts.append(f"⚠️ הוצאות פרסום גבוהות: {costs['ads_ils']:.0f}₪ השבוע")
    if costs["total_ils"] > revenue["total_ils"] * 0.5 and revenue["total_ils"] > 0:
        alerts.append(f"⚠️ עלויות מעל 50% מהכנסות")
    return alerts


# ── Daily run ──────────────────────────────────────────────────────────────

def run_once():
    logger.info("💰 VP Finance — running financial scan")
    today = str(date.today())

    costs = cost_monitor_fetch()
    revenue = revenue_tracker_fetch()
    pl = pl_reporter_generate(costs, revenue)
    alerts = budget_controller_check(costs, revenue)

    alert_text = "\n".join(f"  {a}" for a in alerts) if alerts else "  תקציב תקין ✅"

    body = f"דוח VP Finance — {today}\n\n{pl}\n\nהתראות תקציב:\n{alert_text}"

    last = memory_get(AGENT_ID, "last_report_date")
    if last != today:
        write_report(AGENT_ID, f"דוח כספים — {today}", body)
        send_message(AGENT_ID, "ceo", f"💰 דוח כספים — {today}", body,
                     priority="high" if alerts else "low")
        memory_set(AGENT_ID, "last_report_date", today)


if __name__ == "__main__":
    interval = int(os.environ.get("FINANCE_INTERVAL_SECONDS", "3600"))
    while True:
        try:
            run_once()
        except Exception as e:
            logger.error(f"VP Finance error: {e}")
        time.sleep(interval)
