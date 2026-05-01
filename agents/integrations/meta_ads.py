"""
Meta Marketing API adapter.
Uses facebook-business SDK.
Docs: https://developers.facebook.com/docs/marketing-apis

Required env vars (per project):
  META_ACCESS_TOKEN_{PROJECT}  — User/System access token
  META_AD_ACCOUNT_{PROJECT}    — act_XXXXXXXXX
  META_PAGE_ID_{PROJECT}       — Facebook Page ID
"""
import os
import logging
from typing import Optional

logger = logging.getLogger("meta_ads")

# Lazy import — only when SDK is installed
def _sdk():
    try:
        from facebook_business.api import FacebookAdsApi
        from facebook_business.adobjects.adaccount import AdAccount
        from facebook_business.adobjects.campaign import Campaign
        from facebook_business.adobjects.adset import AdSet
        from facebook_business.adobjects.ad import Ad
        from facebook_business.adobjects.adcreative import AdCreative
        return FacebookAdsApi, AdAccount, Campaign, AdSet, Ad, AdCreative
    except ImportError:
        raise ImportError("pip install facebook-business")


def _init(access_token: str):
    FacebookAdsApi, *_ = _sdk()
    FacebookAdsApi.init(access_token=access_token)


# ── Campaign ───────────────────────────────────────────────────────────────

def create_campaign(
    ad_account_id: str,
    name: str,
    objective: str,
    daily_budget_cents: int,  # USD cents
    access_token: str,
    status: str = "PAUSED",  # always start PAUSED — Gil must manually activate
) -> str:
    """Create a Meta campaign. Returns campaign_id."""
    _init(access_token)
    _, AdAccount, Campaign, *_ = _sdk()

    # Map our objectives to Meta objectives
    OBJECTIVE_MAP = {
        "conversions": "OUTCOME_SALES",
        "leads": "OUTCOME_LEADS",
        "traffic": "OUTCOME_TRAFFIC",
        "awareness": "OUTCOME_AWARENESS",
    }
    meta_objective = OBJECTIVE_MAP.get(objective.lower(), "OUTCOME_TRAFFIC")

    account = AdAccount(f"act_{ad_account_id}" if not ad_account_id.startswith("act_") else ad_account_id)
    campaign = account.create_campaign(
        fields=[Campaign.Field.id],
        params={
            Campaign.Field.name: name,
            Campaign.Field.objective: meta_objective,
            Campaign.Field.status: status,
            Campaign.Field.special_ad_categories: [],
        }
    )
    campaign_id = campaign[Campaign.Field.id]
    logger.info(f"Meta campaign created: {campaign_id} ({name})")
    return campaign_id


def create_ad_set(
    campaign_id: str,
    ad_account_id: str,
    name: str,
    daily_budget_cents: int,
    targeting: dict,
    access_token: str,
    optimization_goal: str = "OFFSITE_CONVERSIONS",
    billing_event: str = "IMPRESSIONS",
) -> str:
    """Create an Ad Set inside a campaign. Returns ad_set_id."""
    _init(access_token)
    _, AdAccount, _, AdSet, *_ = _sdk()

    account = AdAccount(f"act_{ad_account_id}" if not ad_account_id.startswith("act_") else ad_account_id)
    ad_set = account.create_ad_set(
        fields=[AdSet.Field.id],
        params={
            AdSet.Field.name: name,
            AdSet.Field.campaign_id: campaign_id,
            AdSet.Field.daily_budget: daily_budget_cents,
            AdSet.Field.billing_event: billing_event,
            AdSet.Field.optimization_goal: optimization_goal,
            AdSet.Field.targeting: targeting or {
                "geo_locations": {"countries": ["IL"]},
                "age_min": 25,
                "age_max": 60,
            },
            AdSet.Field.status: "PAUSED",
        }
    )
    ad_set_id = ad_set[AdSet.Field.id]
    logger.info(f"Meta ad set created: {ad_set_id}")
    return ad_set_id


def create_ad(
    ad_set_id: str,
    ad_account_id: str,
    page_id: str,
    headline: str,
    body: str,
    image_url: str,
    link_url: str,
    access_token: str,
) -> str:
    """Create an Ad with image creative. Returns ad_id."""
    _init(access_token)
    _, AdAccount, _, _, Ad, AdCreative = _sdk()

    account = AdAccount(f"act_{ad_account_id}" if not ad_account_id.startswith("act_") else ad_account_id)

    creative = account.create_ad_creative(
        params={
            AdCreative.Field.name: f"{headline[:30]} creative",
            AdCreative.Field.object_story_spec: {
                "page_id": page_id,
                "link_data": {
                    "link": link_url,
                    "message": body,
                    "name": headline,
                    "picture": image_url,
                    "call_to_action": {"type": "LEARN_MORE", "value": {"link": link_url}},
                }
            }
        }
    )

    ad = account.create_ad(
        fields=[Ad.Field.id],
        params={
            Ad.Field.name: headline[:40],
            Ad.Field.adset_id: ad_set_id,
            Ad.Field.creative: {"creative_id": creative["id"]},
            Ad.Field.status: "PAUSED",
        }
    )
    ad_id = ad[Ad.Field.id]
    logger.info(f"Meta ad created: {ad_id}")
    return ad_id


def get_campaign_insights(campaign_id: str, access_token: Optional[str] = None) -> dict:
    """Fetch campaign performance metrics for today."""
    if not access_token:
        access_token = os.environ.get("META_ACCESS_TOKEN_DEFAULT", "")
    if not access_token:
        return {}

    _init(access_token)
    _, _, Campaign, *_ = _sdk()

    try:
        campaign = Campaign(campaign_id)
        insights = campaign.get_insights(
            fields=["impressions", "clicks", "spend", "actions", "cpc", "cpm", "ctr"],
            params={"date_preset": "today", "time_increment": 1}
        )
        if not insights:
            return {}

        data = insights[0]
        spend_usd = float(data.get("spend", 0))
        spend_ils = spend_usd / 0.27

        clicks = int(data.get("clicks", 0))
        impressions = int(data.get("impressions", 0))
        cpc_ils = float(data.get("cpc", 0)) / 0.27 if data.get("cpc") else 0

        # Count purchase conversions
        actions = data.get("actions", [])
        conversions = sum(int(a.get("value", 0)) for a in actions if a.get("action_type") in ("purchase", "lead", "complete_registration"))

        roas = None
        purchase_value = sum(float(a.get("value", 0)) for a in data.get("action_values", []) if a.get("action_type") == "purchase")
        if spend_usd > 0 and purchase_value > 0:
            roas = (purchase_value / 0.27) / spend_ils

        return {
            "impressions": impressions,
            "clicks": clicks,
            "conversions": conversions,
            "spend_ils": round(spend_ils, 2),
            "roas": round(roas, 2) if roas else None,
            "cpc_ils": round(cpc_ils, 2),
            "cpm_ils": round(float(data.get("cpm", 0)) / 0.27, 2),
            "ctr": round(float(data.get("ctr", 0)), 4),
        }
    except Exception as e:
        logger.warning(f"Meta insights failed: {e}")
        return {}


def pause_campaign(campaign_id: str, access_token: str) -> None:
    _init(access_token)
    _, _, Campaign, *_ = _sdk()
    Campaign(campaign_id).api_update(params={"status": "PAUSED"})
    logger.info(f"Meta campaign paused: {campaign_id}")


def resume_campaign(campaign_id: str, access_token: str) -> None:
    _init(access_token)
    _, _, Campaign, *_ = _sdk()
    Campaign(campaign_id).api_update(params={"status": "ACTIVE"})
    logger.info(f"Meta campaign resumed: {campaign_id}")
