"""
TikTok for Business API adapter.
REST API via httpx.
Docs: https://ads.tiktok.com/marketing_api/docs

Required env vars (per project):
  TIKTOK_ACCESS_TOKEN_{PROJECT}  — long-lived access token
  TIKTOK_ADVERTISER_{PROJECT}    — advertiser_id
"""
import os
import logging
import httpx
from typing import Optional

logger = logging.getLogger("tiktok_ads")

BASE_URL = "https://business-api.tiktok.com/open_api/v1.3"

ILS_TO_USD = 0.27


def _headers(access_token: str) -> dict:
    return {
        "Access-Token": access_token,
        "Content-Type": "application/json",
    }


def _check(resp: httpx.Response, operation: str) -> dict:
    data = resp.json()
    if data.get("code") != 0:
        msg = data.get("message", "Unknown error")
        raise RuntimeError(f"TikTok API error ({operation}): {msg} | code={data.get('code')}")
    return data.get("data", {})


# ── Campaign ───────────────────────────────────────────────────────────────

def create_campaign(
    advertiser_id: str,
    name: str,
    objective: str,  # "CONVERSIONS" / "TRAFFIC" / "LEAD_GENERATION" / "REACH"
    daily_budget_ils: int,
    access_token: str,
) -> str:
    OBJECTIVE_MAP = {
        "conversions": "CONVERSIONS",
        "traffic": "TRAFFIC",
        "leads": "LEAD_GENERATION",
        "awareness": "REACH",
    }
    tt_objective = OBJECTIVE_MAP.get(objective.lower(), "TRAFFIC")
    daily_budget_usd = round(daily_budget_ils * ILS_TO_USD, 2)

    with httpx.Client(timeout=15) as client:
        resp = client.post(
            f"{BASE_URL}/campaign/create/",
            headers=_headers(access_token),
            json={
                "advertiser_id": advertiser_id,
                "campaign_name": name,
                "objective_type": tt_objective,
                "budget_mode": "BUDGET_MODE_DAY",
                "budget": daily_budget_usd,
                "operation_status": "DISABLE",  # start disabled
            }
        )
    data = _check(resp, "create_campaign")
    campaign_id = data["campaign_id"]
    logger.info(f"TikTok campaign created: {campaign_id} ({name})")
    return campaign_id


def create_ad_group(
    advertiser_id: str,
    campaign_id: str,
    name: str,
    targeting: dict,
    access_token: str,
    daily_budget_usd: float = 10.0,
) -> str:
    with httpx.Client(timeout=15) as client:
        resp = client.post(
            f"{BASE_URL}/adgroup/create/",
            headers=_headers(access_token),
            json={
                "advertiser_id": advertiser_id,
                "campaign_id": campaign_id,
                "adgroup_name": name,
                "budget_mode": "BUDGET_MODE_DAY",
                "budget": daily_budget_usd,
                "schedule_type": "SCHEDULE_START_END",
                "optimization_goal": "CONVERT",
                "billing_event": "OCPM",
                "location_ids": targeting.get("location_ids", ["6252001"]),  # Israel default
                "age_groups": targeting.get("age_groups", ["AGE_25_34", "AGE_35_44", "AGE_45_54"]),
                "operation_status": "DISABLE",
            }
        )
    data = _check(resp, "create_ad_group")
    adgroup_id = data["adgroup_id"]
    logger.info(f"TikTok ad group created: {adgroup_id}")
    return adgroup_id


def get_report(
    advertiser_id: str,
    campaign_ids: list[str],
    access_token: Optional[str] = None,
) -> dict:
    if not access_token:
        access_token = os.environ.get("TIKTOK_ACCESS_TOKEN_DEFAULT", "")
    if not access_token or not campaign_ids:
        return {}

    from datetime import date
    today = date.today().isoformat()

    with httpx.Client(timeout=15) as client:
        resp = client.get(
            f"{BASE_URL}/report/integrated/get/",
            headers=_headers(access_token),
            params={
                "advertiser_id": advertiser_id,
                "report_type": "BASIC",
                "data_level": "AUCTION_CAMPAIGN",
                "dimensions": '["campaign_id"]',
                "metrics": '["spend","impressions","clicks","conversions","cpc","cpm","ctr"]',
                "filters": f'[{{"field_name":"campaign_ids","filter_type":"IN","filter_value":"{campaign_ids}"}}]',
                "start_date": today,
                "end_date": today,
                "page_size": 10,
            }
        )

    try:
        data = _check(resp, "get_report")
        rows = data.get("list", [])
        if not rows:
            return {}

        row = rows[0].get("metrics", {})
        spend_usd = float(row.get("spend", 0))
        spend_ils = spend_usd / ILS_TO_USD
        clicks = int(row.get("clicks", 0))
        conversions = int(row.get("conversions", 0))
        cpc_ils = float(row.get("cpc", 0)) / ILS_TO_USD if row.get("cpc") else 0
        roas = None
        if spend_ils > 0 and conversions > 0:
            # TikTok doesn't give revenue directly; estimate ROAS if we have conversion value
            pass

        return {
            "impressions": int(row.get("impressions", 0)),
            "clicks": clicks,
            "conversions": conversions,
            "spend_ils": round(spend_ils, 2),
            "roas": roas,
            "cpc_ils": round(cpc_ils, 2),
            "cpm_ils": round(float(row.get("cpm", 0)) / ILS_TO_USD, 2),
            "ctr": round(float(row.get("ctr", 0)), 4),
        }
    except Exception as e:
        logger.warning(f"TikTok report failed: {e}")
        return {}


def pause_campaign(advertiser_id: str, campaign_id: str, access_token: str) -> None:
    with httpx.Client(timeout=10) as client:
        resp = client.post(
            f"{BASE_URL}/campaign/status/update/",
            headers=_headers(access_token),
            json={
                "advertiser_id": advertiser_id,
                "campaign_ids": [campaign_id],
                "operation_status": "DISABLE",
            }
        )
    _check(resp, "pause_campaign")
    logger.info(f"TikTok campaign paused: {campaign_id}")
