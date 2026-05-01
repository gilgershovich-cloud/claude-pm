"""
LinkedIn Marketing API adapter.
REST API via httpx.
Docs: https://learn.microsoft.com/en-us/linkedin/marketing/

Required env vars (per project):
  LINKEDIN_ACCESS_TOKEN_{PROJECT}  — OAuth2 access token
  LINKEDIN_ACCOUNT_{PROJECT}       — Sponsor account ID (urn:li:sponsoredAccount:XXX)
"""
import os
import logging
import httpx
from typing import Optional

logger = logging.getLogger("linkedin_ads")

BASE_URL = "https://api.linkedin.com/rest"
ILS_TO_USD = 0.27


def _headers(access_token: str) -> dict:
    return {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202401",
    }


# ── Campaign Group ─────────────────────────────────────────────────────────

def create_campaign_group(
    account_id: str,
    name: str,
    daily_budget_ils: int,
    access_token: str,
) -> str:
    """Create a Campaign Group (equivalent to campaign in other platforms)."""
    daily_budget_usd_cents = int(daily_budget_ils * ILS_TO_USD * 100)

    account_urn = f"urn:li:sponsoredAccount:{account_id}" if not account_id.startswith("urn:") else account_id

    with httpx.Client(timeout=15) as client:
        resp = client.post(
            f"{BASE_URL}/adAccountsV2/{account_id}/adCampaignGroups",
            headers=_headers(access_token),
            json={
                "account": account_urn,
                "name": name,
                "status": "DRAFT",
                "totalBudget": {
                    "amount": str(daily_budget_usd_cents * 30),  # monthly estimate
                    "currencyCode": "USD",
                },
                "runSchedule": {"start": None},
            }
        )

    if resp.status_code not in (200, 201):
        raise RuntimeError(f"LinkedIn create campaign group failed: {resp.status_code} {resp.text[:200]}")

    group_id = resp.json().get("id") or resp.headers.get("x-linkedin-id", "unknown")
    logger.info(f"LinkedIn campaign group created: {group_id}")
    return str(group_id)


def create_campaign(
    account_id: str,
    campaign_group_id: str,
    name: str,
    campaign_type: str,  # "SPONSORED_UPDATES" / "TEXT_AD" / "SPONSORED_INMAILS"
    daily_budget_ils: int,
    objective: str,
    access_token: str,
) -> str:
    daily_budget_usd_cents = int(daily_budget_ils * ILS_TO_USD * 100)

    OBJECTIVE_MAP = {
        "conversions": "WEBSITE_CONVERSIONS",
        "traffic": "WEBSITE_VISITS",
        "leads": "LEAD_GENERATION",
        "awareness": "BRAND_AWARENESS",
    }
    li_objective = OBJECTIVE_MAP.get(objective.lower(), "WEBSITE_VISITS")

    account_urn = f"urn:li:sponsoredAccount:{account_id}" if not account_id.startswith("urn:") else account_id

    with httpx.Client(timeout=15) as client:
        resp = client.post(
            f"{BASE_URL}/adAccountsV2/{account_id}/adCampaigns",
            headers=_headers(access_token),
            json={
                "account": account_urn,
                "campaignGroup": f"urn:li:sponsoredCampaignGroup:{campaign_group_id}",
                "name": name,
                "type": campaign_type,
                "status": "DRAFT",
                "objectiveType": li_objective,
                "dailyBudget": {"amount": str(daily_budget_usd_cents), "currencyCode": "USD"},
                "unitCostAmount": {"amount": "0", "currencyCode": "USD"},
                "costType": "CPM",
                "targetingCriteria": {
                    "include": {
                        "and": [
                            {"or": {"urn:li:adTargetingFacet:locations": ["urn:li:geo:101620260"]}}  # Israel
                        ]
                    }
                },
            }
        )

    if resp.status_code not in (200, 201):
        raise RuntimeError(f"LinkedIn create campaign failed: {resp.status_code} {resp.text[:200]}")

    campaign_id = str(resp.json().get("id") or "unknown")
    logger.info(f"LinkedIn campaign created: {campaign_id}")
    return campaign_id


def get_analytics(
    campaign_ids: list[str],
    access_token: Optional[str] = None,
) -> dict:
    if not access_token:
        access_token = os.environ.get("LINKEDIN_ACCESS_TOKEN_DEFAULT", "")
    if not access_token or not campaign_ids:
        return {}

    from datetime import date
    today = date.today()

    campaign_urns = [f"urn:li:sponsoredCampaign:{cid}" if not cid.startswith("urn:") else cid for cid in campaign_ids]

    try:
        with httpx.Client(timeout=15) as client:
            resp = client.get(
                f"{BASE_URL}/adAnalytics",
                headers=_headers(access_token),
                params={
                    "q": "analytics",
                    "pivot": "CAMPAIGN",
                    "timeGranularity": "DAILY",
                    "campaigns[0]": campaign_urns[0],
                    "fields": "costInLocalCurrency,impressions,clicks,conversions,externalWebsiteConversions",
                    "dateRange.start.year": today.year,
                    "dateRange.start.month": today.month,
                    "dateRange.start.day": today.day,
                    "dateRange.end.year": today.year,
                    "dateRange.end.month": today.month,
                    "dateRange.end.day": today.day,
                }
            )

        if resp.status_code != 200:
            return {}

        elements = resp.json().get("elements", [])
        if not elements:
            return {}

        data = elements[0]
        spend_usd = float(data.get("costInLocalCurrency", 0))
        spend_ils = spend_usd / ILS_TO_USD
        impressions = int(data.get("impressions", 0))
        clicks = int(data.get("clicks", 0))
        conversions = int(data.get("externalWebsiteConversions", 0))
        cpc_ils = (spend_ils / clicks) if clicks > 0 else 0

        return {
            "impressions": impressions,
            "clicks": clicks,
            "conversions": conversions,
            "spend_ils": round(spend_ils, 2),
            "cpc_ils": round(cpc_ils, 2),
            "roas": None,
            "ctr": round(clicks / impressions, 4) if impressions > 0 else 0,
        }
    except Exception as e:
        logger.warning(f"LinkedIn analytics failed: {e}")
        return {}


def pause_campaign(campaign_id: str, account_id: str, access_token: str) -> None:
    with httpx.Client(timeout=10) as client:
        resp = client.post(
            f"{BASE_URL}/adAccountsV2/{account_id}/adCampaigns/{campaign_id}",
            headers=_headers(access_token),
            json={"patch": {"$set": {"status": "PAUSED"}}}
        )
    if resp.status_code not in (200, 204):
        logger.warning(f"LinkedIn pause failed: {resp.status_code}")
    else:
        logger.info(f"LinkedIn campaign paused: {campaign_id}")
