"""
Google Ads API adapter.
Uses google-ads Python library.
Docs: https://developers.google.com/google-ads/api/docs

Required env vars (per project):
  GOOGLE_ADS_CUSTOMER_{PROJECT}         — customer ID (no dashes)
  GOOGLE_ADS_DEVELOPER_TOKEN            — shared developer token
  GOOGLE_ADS_CLIENT_ID                  — OAuth2 client_id
  GOOGLE_ADS_CLIENT_SECRET              — OAuth2 client_secret
  GOOGLE_ADS_REFRESH_TOKEN_{PROJECT}    — OAuth2 refresh token per project
"""
import os
import logging
from typing import Optional
from datetime import date

logger = logging.getLogger("google_ads")

ILS_TO_USD = 0.27


def _client(refresh_token: Optional[str] = None):
    try:
        from google.ads.googleads.client import GoogleAdsClient
    except ImportError:
        raise ImportError("pip install google-ads")

    config = {
        "developer_token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
        "client_id": os.environ["GOOGLE_ADS_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_ADS_CLIENT_SECRET"],
        "refresh_token": refresh_token or os.environ.get("GOOGLE_ADS_REFRESH_TOKEN_DEFAULT", ""),
        "use_proto_plus": True,
    }
    return GoogleAdsClient.load_from_dict(config)


# ── Campaign ───────────────────────────────────────────────────────────────

def create_search_campaign(
    customer_id: str,
    name: str,
    daily_budget_micros: int,   # USD micros (1 USD = 1,000,000)
    refresh_token: Optional[str] = None,
    keywords: Optional[list[str]] = None,
    language_id: str = "1027",  # Hebrew
) -> str:
    """Create a Search campaign. Returns resource_name."""
    ga_client = _client(refresh_token)
    campaign_service = ga_client.get_service("CampaignService")
    budget_service = ga_client.get_service("CampaignBudgetService")

    # Create budget
    budget_op = ga_client.get_type("CampaignBudgetOperation")
    budget = budget_op.create
    budget.name = f"{name} budget"
    budget.delivery_method = ga_client.enums.BudgetDeliveryMethodEnum.STANDARD
    budget.amount_micros = daily_budget_micros

    budget_response = budget_service.mutate_campaign_budgets(
        customer_id=customer_id, operations=[budget_op]
    )
    budget_resource = budget_response.results[0].resource_name

    # Create campaign
    campaign_op = ga_client.get_type("CampaignOperation")
    campaign = campaign_op.create
    campaign.name = name
    campaign.advertising_channel_type = ga_client.enums.AdvertisingChannelTypeEnum.SEARCH
    campaign.status = ga_client.enums.CampaignStatusEnum.PAUSED  # always start paused
    campaign.campaign_budget = budget_resource
    campaign.network_settings.target_google_search = True
    campaign.network_settings.target_search_network = True

    # Israel targeting
    campaign.geo_target_type_setting.positive_geo_target_type = (
        ga_client.enums.PositiveGeoTargetTypeEnum.PRESENCE_OR_INTEREST
    )

    response = campaign_service.mutate_campaigns(
        customer_id=customer_id, operations=[campaign_op]
    )
    resource_name = response.results[0].resource_name
    logger.info(f"Google campaign created: {resource_name}")
    return resource_name


def create_display_campaign(
    customer_id: str,
    name: str,
    daily_budget_micros: int,
    refresh_token: Optional[str] = None,
) -> str:
    """Create a Display campaign for awareness."""
    ga_client = _client(refresh_token)
    campaign_service = ga_client.get_service("CampaignService")
    budget_service = ga_client.get_service("CampaignBudgetService")

    budget_op = ga_client.get_type("CampaignBudgetOperation")
    budget_op.create.name = f"{name} budget"
    budget_op.create.delivery_method = ga_client.enums.BudgetDeliveryMethodEnum.STANDARD
    budget_op.create.amount_micros = daily_budget_micros

    budget_response = budget_service.mutate_campaign_budgets(
        customer_id=customer_id, operations=[budget_op]
    )

    campaign_op = ga_client.get_type("CampaignOperation")
    campaign_op.create.name = name
    campaign_op.create.advertising_channel_type = ga_client.enums.AdvertisingChannelTypeEnum.DISPLAY
    campaign_op.create.status = ga_client.enums.CampaignStatusEnum.PAUSED
    campaign_op.create.campaign_budget = budget_response.results[0].resource_name

    response = campaign_service.mutate_campaigns(
        customer_id=customer_id, operations=[campaign_op]
    )
    resource_name = response.results[0].resource_name
    logger.info(f"Google Display campaign created: {resource_name}")
    return resource_name


def get_campaign_performance(
    resource_name: str,
    customer_id: Optional[str] = None,
    refresh_token: Optional[str] = None,
) -> dict:
    if not customer_id:
        customer_id = os.environ.get("GOOGLE_ADS_CUSTOMER_DEFAULT", "")
    if not customer_id:
        return {}

    try:
        ga_client = _client(refresh_token)
        ga_service = ga_client.get_service("GoogleAdsService")

        today = date.today().isoformat()
        query = f"""
            SELECT
                campaign.id,
                metrics.impressions,
                metrics.clicks,
                metrics.cost_micros,
                metrics.conversions,
                metrics.average_cpc,
                metrics.ctr
            FROM campaign
            WHERE campaign.resource_name = '{resource_name}'
            AND segments.date = '{today}'
        """

        response = ga_service.search(customer_id=customer_id, query=query)
        for row in response:
            metrics = row.metrics
            cost_usd = metrics.cost_micros / 1_000_000
            cost_ils = cost_usd / ILS_TO_USD
            cpc_usd = metrics.average_cpc / 1_000_000 if metrics.average_cpc else 0
            cpc_ils = cpc_usd / ILS_TO_USD

            return {
                "impressions": int(metrics.impressions),
                "clicks": int(metrics.clicks),
                "conversions": int(metrics.conversions),
                "spend_ils": round(cost_ils, 2),
                "cpc_ils": round(cpc_ils, 2),
                "ctr": round(float(metrics.ctr), 4),
                "roas": None,  # requires conversion value tracking
            }
    except Exception as e:
        logger.warning(f"Google performance fetch failed: {e}")
    return {}


def pause_campaign(resource_name: str, customer_id: str, refresh_token: Optional[str] = None) -> None:
    ga_client = _client(refresh_token)
    campaign_service = ga_client.get_service("CampaignService")

    campaign_op = ga_client.get_type("CampaignOperation")
    campaign_op.update.resource_name = resource_name
    campaign_op.update.status = ga_client.enums.CampaignStatusEnum.PAUSED

    from google.protobuf import field_mask_pb2
    campaign_op.update_mask.CopyFrom(field_mask_pb2.FieldMask(paths=["status"]))

    campaign_service.mutate_campaigns(customer_id=customer_id, operations=[campaign_op])
    logger.info(f"Google campaign paused: {resource_name}")
