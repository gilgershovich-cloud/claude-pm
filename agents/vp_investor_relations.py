"""
VP Investor Relations — manages the ClinicOS ₪2M Seed raise.

Team:
  - Pipeline Tracker: tracks all investor conversations and their status
  - Follow-up Agent: alerts when an investor has gone 7+ days without a response
  - Deck Sender: logs when investor deck was requested and sent
  - Weekly Report: summarizes the raise pipeline every Sunday
"""
import os
import logging
from datetime import datetime, timezone, timedelta

from base_agent import (
    db, memory_get, memory_set, send_message,
    write_report, request_decision, ask_claude, now_iso,
)

AGENT_ID = "vp_investor_relations"
logger = logging.getLogger(AGENT_ID)

STALE_DAYS = 7        # alert if no response after this many days
WARM_DAYS  = 3        # remind to follow up after first contact


# ── Pipeline Tracker ────────────────────────────────────────────────────────

def pipeline_get() -> list[dict]:
    """Returns all investor conversations from Supabase."""
    try:
        rows = (
            db().table("investor_pipeline")
            .select("*")
            .order("last_contact", desc=True)
            .execute()
            .data
        ) or []
        return rows
    except Exception as e:
        logger.warning(f"pipeline_get failed: {e}")
        return []


def pipeline_upsert(investor_name: str, phone: str, status: str, notes: str = "") -> None:
    """Add or update an investor in the pipeline."""
    try:
        db().table("investor_pipeline").upsert({
            "phone":        phone,
            "name":         investor_name,
            "status":       status,
            "notes":        notes,
            "last_contact": now_iso(),
            "updated_at":   now_iso(),
        }, on_conflict="phone").execute()
    except Exception as e:
        logger.error(f"pipeline_upsert failed: {e}")


# ── Follow-up Agent ─────────────────────────────────────────────────────────

def check_stale_investors(pipeline: list[dict]) -> list[dict]:
    """Returns investors who have not responded in STALE_DAYS."""
    now = datetime.now(timezone.utc)
    stale = []
    for inv in pipeline:
        if inv.get("status") not in ("contacted", "deck_sent", "warm"):
            continue
        last = inv.get("last_contact")
        if not last:
            continue
        try:
            last_dt = datetime.fromisoformat(last.replace("Z", "+00:00"))
            if (now - last_dt).days >= STALE_DAYS:
                stale.append(inv)
        except Exception:
            pass
    return stale


def draft_followup(investor: dict) -> str:
    days = 0
    last = investor.get("last_contact")
    if last:
        try:
            last_dt = datetime.fromisoformat(last.replace("Z", "+00:00"))
            days = (datetime.now(timezone.utc) - last_dt).days
        except Exception:
            pass

    return ask_claude(
        system=(
            "אתה מנהל Investor Relations מקצועי. "
            "כתוב הודעת WhatsApp קצרה ומנומסת (2–3 משפטים) לשליחה למשקיע פוטנציאל. "
            "ההודעה תהיה תחת שם החברה 'ClinicOS', לא שם אישי. "
            "טון: חם, אמין, לא דחוף."
        ),
        user=(
            f"שם משקיע: {investor.get('name')}\n"
            f"סטטוס: {investor.get('status')}\n"
            f"ימים ללא תגובה: {days}\n"
            f"הערות: {investor.get('notes', '')}\n\n"
            "כתוב הודעת follow-up קצרה."
        ),
        max_tokens=180,
    )


# ── Weekly Report ────────────────────────────────────────────────────────────

def build_weekly_report(pipeline: list[dict]) -> str:
    if not pipeline:
        return "אין נתוני pipeline עדיין."

    statuses: dict[str, int] = {}
    for inv in pipeline:
        s = inv.get("status", "unknown")
        statuses[s] = statuses.get(s, 0) + 1

    total   = len(pipeline)
    warm    = statuses.get("warm", 0) + statuses.get("deck_sent", 0)
    closed  = statuses.get("committed", 0)
    stale   = len(check_stale_investors(pipeline))

    lines = [
        f"📊 **ClinicOS Seed Round — Weekly Update**",
        f"",
        f"סה\"כ פניות: {total}",
        f"חמים (deck sent / warm): {warm}",
        f"התחייבו: {closed}",
        f"מחכים תגובה {STALE_DAYS}+ ימים: {stale}",
        f"",
        "סטטוסים:",
    ]
    for status, count in sorted(statuses.items()):
        lines.append(f"  • {status}: {count}")

    return "\n".join(lines)


# ── Main Loop ────────────────────────────────────────────────────────────────

def run_once() -> None:
    logger.info("VP Investor Relations — starting cycle")

    pipeline = pipeline_get()

    # 1. Check for stale investors → alert Gil
    stale = check_stale_investors(pipeline)
    if stale:
        for inv in stale:
            followup = draft_followup(inv)
            alert = (
                f"⚠️ *משקיע לא ענה {STALE_DAYS}+ ימים*\n"
                f"שם: {inv.get('name')}\n"
                f"סטטוס: {inv.get('status')}\n\n"
                f"הצעה לfollowup:\n_{followup}_"
            )
            send_message(alert)
            logger.info(f"Stale investor alert: {inv.get('name')}")

    # 2. Weekly report every Sunday
    now = datetime.now(timezone.utc)
    last_report = memory_get(AGENT_ID, "last_weekly_report")
    should_report = False
    if not last_report:
        should_report = True
    else:
        try:
            last_dt = datetime.fromisoformat(last_report)
            if (now - last_dt).days >= 7:
                should_report = True
        except Exception:
            should_report = True

    if should_report and now.weekday() == 6:  # Sunday
        report = build_weekly_report(pipeline)
        write_report(AGENT_ID, "Investor Pipeline — Weekly", report)
        send_message(f"📈 *ClinicOS Seed — Weekly Pipeline*\n\n{report}")
        memory_set(AGENT_ID, "last_weekly_report", now_iso())

    # 3. Log pipeline summary to DB
    summary = {
        "total": len(pipeline),
        "stale": len(stale),
        "warm":  sum(1 for i in pipeline if i.get("status") in ("warm", "deck_sent")),
        "committed": sum(1 for i in pipeline if i.get("status") == "committed"),
    }
    memory_set(AGENT_ID, "pipeline_summary", summary)

    logger.info(f"Cycle done — pipeline: {summary}")


if __name__ == "__main__":
    run_once()
