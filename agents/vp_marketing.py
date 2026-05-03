"""
VP Marketing Agent — autonomous marketing for all live projects.

Responsibilities:
- Analyze which ad platforms suit each project (via Claude)
- Propose ad campaigns + request Gil's approval (every ₪ needs approval)
- Monitor campaign performance hourly (ROAS, CPC, conversions)
- Generate proposal/purchase pages autonomously
- Manage social account connections per project
"""
import os
import time
import json
import logging
from datetime import datetime, timezone, date

from base_agent import (
    db, ai, memory_get, memory_set,
    send_message, open_incident, write_report,
    request_decision, get_pending_decisions, ask_claude
)

AGENT_ID = "vp_marketing"
logger = logging.getLogger(AGENT_ID)

ILS_TO_USD = 0.27  # approximate conversion for API calls that need USD


# ── Platform analyzer ──────────────────────────────────────────────────────

PLATFORM_KNOWLEDGE = """
Meta (Facebook + Instagram):
- חזק לקהל ישראלי, B2C, 25-55, טרגטינג מדויק לפי תחום/תחביבים
- מצוין: קליניקות, SaaS B2C, אסתטיקה, אורח חיים
- CPM ישראל: ~₪15-40

Google Search Ads:
- מצוין כשיש כוונת קנייה ברורה ("מזכירה לקליניקה", "כלי לסושיאל מדיה")
- יקר יותר אבל המרה גבוהה
- CPC ישראל: ~₪3-15

TikTok Ads:
- קהל צעיר 18-35, מצוין לוידאו-first מוצרים
- CPM נמוך, מתאים ל-Social AI Platform
- פחות מתאים לקליניקות אסתטיקה (קהל בוגר יותר)

LinkedIn Ads:
- B2B בלבד, יקר (CPM ~₪80-200)
- מתאים אם M.D Clinic פונה לניהול קליניקות/רשתות גדולות
"""


def analyze_project_platforms(group_id: str, project_name: str, goal: str, target: str) -> list[str]:
    prompt = (
        f"פרויקט: {project_name}\n"
        f"מטרה: {goal}\n"
        f"קהל יעד: {target}\n\n"
        f"ידע על פלטפורמות:\n{PLATFORM_KNOWLEDGE}\n\n"
        f"אילו 1-3 פלטפורמות (meta/google/tiktok/linkedin) מתאימות ביותר לפרויקט זה?\n"
        f"ענה JSON בלבד: {{\"platforms\": [...], \"reasoning\": \"...\"}}"
    )
    try:
        result = ask_claude(
            system="אתה VP שיווק מנוסה של חברת AI ישראלית. ענה JSON בלבד.",
            user=prompt,
            max_tokens=200,
        )
        import re
        json_match = re.search(r'\{.*\}', result, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            platforms = [p for p in data.get("platforms", []) if p in ("meta", "google", "tiktok", "linkedin")]
            reasoning = data.get("reasoning", "")
            memory_set(AGENT_ID, f"platform_reasoning_{group_id}", reasoning)
            return platforms
    except Exception as e:
        logger.warning(f"Platform analysis failed: {e}")
    return ["meta"]


# ── Campaign strategy builder ──────────────────────────────────────────────

def build_campaign_strategy(project_name: str, platform: str, goal: str, target: str, budget_ils: int) -> dict:
    prompt = (
        f"בנה אסטרטגיית קמפיין ב-{platform} עבור:\n"
        f"מוצר: {project_name}\n"
        f"מטרה: {goal}\n"
        f"קהל: {target}\n"
        f"תקציב יומי: {budget_ils}₪\n\n"
        f"ענה JSON: {{\n"
        f"  \"campaign_name\": \"...\",\n"
        f"  \"objective\": \"conversions|traffic|leads|awareness\",\n"
        f"  \"targeting_summary\": \"...\",\n"
        f"  \"ad_copy_headline\": \"...\",\n"
        f"  \"ad_copy_body\": \"...\",\n"
        f"  \"expected_cpc_ils\": 0,\n"
        f"  \"expected_conversions_per_day\": 0\n"
        f"}}"
    )
    try:
        result = ask_claude(
            system="אתה מומחה פרסום דיגיטלי. ענה JSON בלבד בעברית.",
            user=prompt, max_tokens=400,
        )
        import re
        json_match = re.search(r'\{.*\}', result, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        logger.warning(f"Strategy build failed: {e}")
    return {
        "campaign_name": f"{project_name} — {platform}",
        "objective": "conversions",
        "targeting_summary": target,
        "ad_copy_headline": f"גלה את {project_name}",
        "ad_copy_body": goal,
    }


# ── New project setup ──────────────────────────────────────────────────────

def setup_new_project_marketing(group_id: str) -> None:
    """Called when a project transitions to live_managed and needs_marketing=True."""
    config = db().table("project_marketing_config").select("*").eq("group_id", group_id).maybe_single().execute()
    config = config.data if config else None
    if not config or not config.get("needs_marketing"):
        return

    if config.get("approved_by_gil"):
        return  # already set up

    group = db().table("groups").select("name").eq("id", group_id).maybe_single().execute()
    group = group.data if group else None
    project_name = group["name"] if group else group_id

    # Analyze platforms
    platforms = analyze_project_platforms(
        group_id, project_name,
        config.get("goal", ""), config.get("target_audience", "")
    )

    # Update config with recommended platforms
    db().table("project_marketing_config").update({
        "platforms": json.dumps(platforms),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("group_id", group_id).execute()

    reasoning = memory_get(AGENT_ID, f"platform_reasoning_{group_id}", "")

    # Request Gil's approval for marketing setup
    decision_id = request_decision(
        AGENT_ID,
        f"🚀 שיווק — {project_name}: אשר פלטפורמות וחשבונות",
        f"VP Marketing ניתח את הפרויקט '{project_name}':\n\n"
        f"מטרה: {config.get('goal', 'לא הוגדר')}\n"
        f"קהל יעד: {config.get('target_audience', 'לא הוגדר')}\n\n"
        f"פלטפורמות מומלצות: {', '.join(platforms)}\n"
        f"נימוק: {reasoning}\n\n"
        f"לאחר אישורך:\n"
        + "\n".join(f"  • {p}: הגדר env var {p.upper()}_ACCESS_TOKEN_{project_name.upper().replace(' ', '_')}" for p in platforms)
        + "\n\nאין הוצאת כסף עדיין — רק הגדרת חשבונות.",
        risk_tier="medium"
    )

    send_message(
        AGENT_ID, "ceo",
        f"📢 {project_name} — הצעת שיווק נשלחה לגיל",
        f"בקשת אישור לשיווק נשלחה. פלטפורמות: {', '.join(platforms)}",
        priority="medium"
    )

    logger.info(f"Marketing setup decision sent for {project_name}: {platforms}")


# ── Campaign proposal ──────────────────────────────────────────────────────

def propose_campaign(group_id: str, platform: str, daily_budget_ils: int) -> None:
    """Build a campaign strategy and ask Gil to approve every shekel."""
    config = db().table("project_marketing_config").select("*").eq("group_id", group_id).maybe_single().execute()
    config = config.data if config else None
    if not config:
        return

    group = db().table("groups").select("name").eq("id", group_id).maybe_single().execute()
    group = group.data if group else None
    project_name = group["name"] if group else group_id

    strategy = build_campaign_strategy(
        project_name, platform,
        config.get("goal", ""), config.get("target_audience", ""),
        daily_budget_ils
    )

    # Save draft campaign
    campaign_row = db().table("ad_campaigns").insert({
        "group_id": group_id,
        "platform": platform,
        "name": strategy.get("campaign_name", f"{project_name} — {platform}"),
        "status": "pending_approval",
        "objective": strategy.get("objective", "conversions"),
        "daily_budget_ils": daily_budget_ils,
        "approved_by_gil": False,
    }).execute().data[0]

    expected_cpc = strategy.get("expected_cpc_ils", 5)
    expected_conv = strategy.get("expected_conversions_per_day", 0)

    decision_id = request_decision(
        AGENT_ID,
        f"💰 אשר קמפיין {platform} — {project_name} ({daily_budget_ils}₪/יום)",
        f"VP Marketing בנה קמפיין לאישורך:\n\n"
        f"פרויקט: {project_name}\n"
        f"פלטפורמה: {platform}\n"
        f"שם קמפיין: {strategy.get('campaign_name')}\n"
        f"מטרה: {strategy.get('objective')}\n"
        f"תקציב יומי: {daily_budget_ils}₪ (חייב אישורך לכל ₪)\n\n"
        f"טרגטינג: {strategy.get('targeting_summary', '')}\n\n"
        f"כותרת מודעה: {strategy.get('ad_copy_headline', '')}\n"
        f"גוף מודעה: {strategy.get('ad_copy_body', '')}\n\n"
        f"תחזית: CPC ~{expected_cpc}₪, ~{expected_conv} המרות/יום\n\n"
        f"לאישור → הקמפיין יופעל אוטומטית.",
        risk_tier="high"
    )

    # Update campaign with decision_id
    db().table("ad_campaigns").update({"decision_id": decision_id}).eq("id", campaign_row["id"]).execute()

    logger.info(f"Campaign proposal sent for {project_name} on {platform}: {daily_budget_ils}₪/day")


# ── Campaign monitor ───────────────────────────────────────────────────────

def monitor_campaigns() -> None:
    """Check live campaigns, fetch metrics, optimize."""
    active = db().table("ad_campaigns").select("*").eq("status", "active").execute()
    if not active:
        return

    for campaign in active:
        try:
            _check_campaign_performance(campaign)
        except Exception as e:
            logger.error(f"Monitor failed for campaign {campaign['id']}: {e}")


def _check_campaign_performance(campaign: dict) -> None:
    platform = campaign["platform"]
    group_id = campaign["group_id"]

    # Import the right adapter
    metrics = _fetch_metrics(campaign)
    if not metrics:
        return

    # Save metrics
    db().table("campaign_metrics").insert({
        "campaign_id": campaign["id"],
        "impressions": metrics.get("impressions", 0),
        "clicks": metrics.get("clicks", 0),
        "conversions": metrics.get("conversions", 0),
        "spend_ils": metrics.get("spend_ils", 0),
        "roas": metrics.get("roas"),
        "cpc_ils": metrics.get("cpc_ils"),
        "cpm_ils": metrics.get("cpm_ils"),
        "ctr": metrics.get("ctr"),
    }).execute()

    roas = metrics.get("roas", 0) or 0
    spend = metrics.get("spend_ils", 0) or 0

    group = db().table("groups").select("name").eq("id", group_id).maybe_single().execute()
    group = group.data if group else None
    project_name = group["name"] if group else group_id

    # ROAS too low → propose pause
    if roas < 1.2 and spend > 50:
        request_decision(
            AGENT_ID,
            f"⚠️ {project_name} — {platform}: ROAS נמוך ({roas:.1f}x), מציע עצירה",
            f"קמפיין: {campaign['name']}\n"
            f"ROAS: {roas:.2f}x (סף מינימלי: 1.2x)\n"
            f"הוצאה עד כה: {spend:.0f}₪\n\n"
            f"לאישור → הקמפיין יעצר מיד.",
            risk_tier="high"
        )

    # ROAS great → propose scaling
    elif roas > 3.0 and spend < campaign["daily_budget_ils"] * 0.8:
        request_decision(
            AGENT_ID,
            f"🚀 {project_name} — {platform}: ROAS מצוין ({roas:.1f}x), מציע הגדלת תקציב",
            f"קמפיין: {campaign['name']}\n"
            f"ROAS: {roas:.2f}x (מצוין!)\n"
            f"תקציב נוכחי: {campaign['daily_budget_ils']}₪/יום\n"
            f"הצעה: הגדל ל-{int(campaign['daily_budget_ils'] * 1.5)}₪/יום\n\n"
            f"כל שינוי תקציב דורש אישורך.",
            risk_tier="high"
        )


def _fetch_metrics(campaign: dict) -> dict | None:
    """Fetch metrics from the right platform adapter."""
    platform = campaign["platform"]
    external_id = campaign.get("campaign_id_external")

    if not external_id:
        return None

    try:
        if platform == "meta":
            from integrations.meta_ads import get_campaign_insights
            return get_campaign_insights(external_id)
        elif platform == "tiktok":
            from integrations.tiktok_ads import get_report
            advertiser_id = os.environ.get("TIKTOK_ADVERTISER_DEFAULT", "")
            return get_report(advertiser_id, [external_id])
        elif platform == "google":
            from integrations.google_ads import get_campaign_performance
            return get_campaign_performance(external_id)
        elif platform == "linkedin":
            from integrations.linkedin_ads import get_analytics
            return get_analytics([external_id])
    except ImportError:
        logger.debug(f"Adapter for {platform} not yet configured")
    except Exception as e:
        logger.warning(f"Metrics fetch failed for {platform}: {e}")
    return None


# ── Detect approved campaigns ──────────────────────────────────────────────

def activate_approved_campaigns() -> None:
    """Check if any pending campaigns were approved by Gil and activate them."""
    r_p = db().table("ad_campaigns").select("*").eq("status", "pending_approval").execute()
    pending = r_p.data if r_p and r_p.data else []

    for campaign in pending:
        decision_id = campaign.get("decision_id")
        if not decision_id:
            continue

        dr = db().table("agent_decisions").select("status").eq("id", decision_id).maybe_single().execute()
        decision = dr.data if dr else None
        if not decision or decision["status"] != "approved":
            continue

        # Gil approved → activate
        try:
            _launch_campaign(campaign)
            db().table("ad_campaigns").update({
                "status": "active",
                "approved_by_gil": True,
                "approved_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", campaign["id"]).execute()
            logger.info(f"Campaign activated: {campaign['name']}")
        except Exception as e:
            logger.error(f"Campaign launch failed: {e}")
            open_incident(AGENT_ID, "marketing", f"קמפיין נכשל להפעלה: {campaign['name']}", str(e), "high")


def _launch_campaign(campaign: dict) -> None:
    """Launch campaign on the platform API."""
    platform = campaign["platform"]
    group_id = campaign["group_id"]

    # Get the social account for this project+platform
    account = db().table("social_accounts").select("*").eq("group_id", group_id).eq("platform", platform).eq("account_type", "ad_account").maybe_single().execute()
    account = account.data if account else None

    if not account:
        raise ValueError(f"No {platform} ad account configured for this project")

    token = os.environ.get(account["env_token_key"], "")
    if not token:
        raise ValueError(f"Token env var {account['env_token_key']} not set in Railway")

    if platform == "meta":
        from integrations.meta_ads import create_campaign, create_ad_set, create_ad
        ext_id = create_campaign(
            account["account_id"], campaign["name"],
            campaign.get("objective", "CONVERSIONS"),
            int(campaign["daily_budget_ils"] / ILS_TO_USD * 100),  # cents
            token
        )
        db().table("ad_campaigns").update({"campaign_id_external": ext_id}).eq("id", campaign["id"]).execute()

    elif platform == "tiktok":
        from integrations.tiktok_ads import create_campaign as tt_create
        ext_id = tt_create(
            account["account_id"], campaign["name"],
            campaign.get("objective", "CONVERSIONS"),
            campaign["daily_budget_ils"], token
        )
        db().table("ad_campaigns").update({"campaign_id_external": ext_id}).eq("id", campaign["id"]).execute()

    elif platform == "google":
        from integrations.google_ads import create_search_campaign
        ext_id = create_search_campaign(
            account["account_id"], campaign["name"],
            int(campaign["daily_budget_ils"] / ILS_TO_USD * 1_000_000),  # micros
            token
        )
        db().table("ad_campaigns").update({"campaign_id_external": ext_id}).eq("id", campaign["id"]).execute()


# ── New project detector ───────────────────────────────────────────────────

def detect_new_live_projects() -> None:
    """Find projects with needs_marketing=True that haven't been approved yet.

    Marketing can start before a project is fully live_managed — for example,
    M.D Clinic needs outreach campaigns while still in development/pre-sales.
    """
    r = db().table("project_marketing_config").select("group_id,needs_marketing,approved_by_gil").eq("needs_marketing", True).execute()
    configs = r.data if r and r.data else []

    for config in configs:
        if config.get("approved_by_gil"):
            continue  # already set up
        setup_new_project_marketing(config["group_id"])


# ── Daily marketing report ─────────────────────────────────────────────────

def write_marketing_report() -> None:
    today = date.today().isoformat()
    last = memory_get(AGENT_ID, "last_report_date")
    if last == today:
        return

    r_ac = db().table("ad_campaigns").select("*").eq("status", "active").execute()
    active_campaigns = r_ac.data if r_ac and r_ac.data else []
    total_spend = sum(c.get("total_spent_ils", 0) or 0 for c in active_campaigns)

    lines = []
    for c in active_campaigns:
        mr = db().table("campaign_metrics").select("*").eq("campaign_id", c["id"]).order("measured_at", desc=True).limit(1).execute()
        metrics = mr.data if mr and mr.data else []
        latest = metrics[0] if metrics else {}
        roas = latest.get("roas") or 0
        spend = latest.get("spend_ils") or 0
        lines.append(f"  [{c['platform'].upper()}] {c['name']}: ROAS {roas:.1f}x, {spend:.0f}₪ היום")

    body = (
        f"דוח VP Marketing — {today}\n\n"
        f"קמפיינים פעילים: {len(active_campaigns)}\n"
        f"{'  ' + chr(10).join(lines) if lines else '  אין קמפיינים פעילים'}\n\n"
        f"הוצאה כוללת: {total_spend:.0f}₪"
    )
    write_report(AGENT_ID, f"דוח שיווק — {today}", body)
    memory_set(AGENT_ID, "last_report_date", today)


# ── Main ───────────────────────────────────────────────────────────────────

def run_once() -> None:
    logger.info("📢 VP Marketing — starting run")
    try:
        detect_new_live_projects()
        activate_approved_campaigns()
        monitor_campaigns()
        write_marketing_report()
    except Exception as e:
        logger.error(f"VP Marketing run error: {e}")


if __name__ == "__main__":
    interval = int(os.environ.get("MARKETING_INTERVAL_SECONDS", "3600"))
    logger.info(f"VP Marketing starting — interval: {interval}s")
    while True:
        run_once()
        time.sleep(interval)
