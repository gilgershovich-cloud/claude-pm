"""
Autonomous Proposal Page Generator.

Generates a complete Hebrew RTL purchase/proposal page for any project.
Uses Claude to write the copy, applies the design system from M.D Clinic proposal.
Stores in Supabase proposal_pages table.

Usage:
    from proposal_generator import generate_page
    url = generate_page(group_id, config)
"""
import os
import re
import json
import logging
from datetime import datetime, timezone

from base_agent import db, ask_claude, send_message

logger = logging.getLogger("proposal_generator")

RAILWAY_BASE = os.environ.get("PROPOSALS_BASE_URL", "https://social-ai-platform-production.up.railway.app")


# ── Page content generator ─────────────────────────────────────────────────

def _generate_copy(
    project_name: str,
    description: str,
    target_audience: str,
    features: list[str],
    price_ils: int,
    cta_text: str,
    payment_provider: str,
) -> dict:
    """Ask Claude to write all page copy in Hebrew."""

    features_str = "\n".join(f"- {f}" for f in features)

    prompt = (
        f"כתוב תוכן לעמוד הצעת מחיר עבור:\n"
        f"מוצר: {project_name}\n"
        f"תיאור: {description}\n"
        f"קהל יעד: {target_audience}\n"
        f"תכונות:\n{features_str}\n"
        f"מחיר: {price_ils:,}₪\n\n"
        f"ענה JSON בלבד:\n"
        "{\n"
        '  "hero_title": "כותרת קצרה ומשכנעת (עד 8 מילים)",\n'
        '  "hero_subtitle": "תת-כותרת (עד 20 מילים)",\n'
        '  "problem_statement": "הבעיה שאנחנו פותרים (2-3 משפטים)",\n'
        '  "value_proposition": "מה מייחד אותנו (2-3 משפטים)",\n'
        '  "features": [{"icon": "emoji", "title": "...", "desc": "..."}],\n'
        '  "social_proof": "משפט המלצה (שאיפה, לא ממציאים לקוח אמיתי)",\n'
        '  "cta_headline": "כותרת מעל כפתור CTA",\n'
        '  "guarantee_text": "ערבות/ביטחון ללקוח"\n'
        "}"
    )

    try:
        result = ask_claude(
            system=(
                "אתה קופירייטר מומחה לשיווק דיגיטלי בעברית. "
                "כתוב תוכן מותאם לקהל ישראלי, בגוף ראשון, ישיר ומשכנע. "
                "ענה JSON בלבד."
            ),
            user=prompt,
            max_tokens=800,
        )
        json_match = re.search(r'\{.*\}', result, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        logger.warning(f"Copy generation failed: {e}")

    # Fallback copy
    return {
        "hero_title": project_name,
        "hero_subtitle": description,
        "problem_statement": f"קהל יעד: {target_audience}",
        "value_proposition": "פתרון AI מתקדם",
        "features": [{"icon": "✅", "title": f, "desc": ""} for f in features[:5]],
        "social_proof": "לקוחות מרוצים",
        "cta_headline": cta_text,
        "guarantee_text": "שביעות רצון מובטחת",
    }


# ── HTML builder ───────────────────────────────────────────────────────────

def _build_html(
    project_name: str,
    copy: dict,
    price_ils: int,
    cta_text: str,
    payment_provider: str,
    payment_config: dict,
    primary_color: str = "#1450A3",
) -> str:
    features_html = "".join(
        f'<div class="feature"><span class="feature-icon">{f.get("icon","✅")}</span>'
        f'<div><b>{f.get("title","")}</b>'
        f'{"<br><small>" + f.get("desc","") + "</small>" if f.get("desc") else ""}'
        f'</div></div>'
        for f in copy.get("features", [])
    )

    # Payment button logic
    if payment_provider == "green_invoice":
        payment_js = f"""
async function handlePayment() {{
  const btn = document.getElementById('cta-btn');
  btn.disabled = true;
  btn.textContent = 'מעבד...';
  try {{
    const res = await fetch('{payment_config.get("payment_endpoint", "/proposal/payment")}', {{
      method: 'POST',
      headers: {{'Content-Type': 'application/json'}},
      body: JSON.stringify({{name: '{project_name}', email: '', phone: '', tier: 1}})
    }});
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else throw new Error('No URL');
  }} catch(e) {{
    btn.disabled = false;
    btn.textContent = '{cta_text}';
    alert('שגיאה. נסה שנית.');
  }}
}}"""
    elif payment_provider == "stripe":
        payment_js = f"""
async function handlePayment() {{
  const btn = document.getElementById('cta-btn');
  btn.disabled = true;
  btn.textContent = 'מעבד...';
  try {{
    const res = await fetch('{payment_config.get("checkout_endpoint", "/payments/checkout-session")}', {{
      method: 'POST',
      headers: {{'Content-Type': 'application/json'}},
      body: JSON.stringify({{plan: '{payment_config.get("plan","starter")}', email: '', tenant_id: ''}})
    }});
    const data = await res.json();
    if (data.checkout_url) window.location.href = data.checkout_url;
    else throw new Error('No URL');
  }} catch(e) {{
    btn.disabled = false;
    btn.textContent = '{cta_text}';
    alert('שגיאה. נסה שנית.');
  }}
}}"""
    else:
        payment_js = f"""
function handlePayment() {{
  alert('ליצירת קשר: {payment_config.get("contact", "צור קשר")}');
}}"""

    return f"""<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{project_name} — הצעת מחיר</title>
<style>
  :root{{--primary:{primary_color};--primary2:{primary_color}dd;--light:#E8F0FE;--green:#16a34a;--gray:#6b7280;--r:16px}}
  *{{box-sizing:border-box;margin:0;padding:0}}
  body{{font-family:-apple-system,'Segoe UI',Arial,sans-serif;background:#f5f7ff;color:#1a1a2e;min-height:100vh}}
  .header{{background:var(--primary);color:white;text-align:center;padding:40px 20px 32px}}
  .header h1{{font-size:clamp(1.8rem,5vw,3rem);font-weight:800;letter-spacing:-1px}}
  .header .subtitle{{font-size:clamp(1rem,2.5vw,1.3rem);opacity:.9;margin-top:10px}}
  .container{{max-width:680px;margin:0 auto;padding:32px 16px 60px}}
  .section{{background:white;border-radius:var(--r);padding:28px;margin-bottom:20px;border:1px solid #e5e7eb}}
  .section h2{{font-size:1.2rem;font-weight:700;margin-bottom:14px;color:var(--primary)}}
  .problem{{background:#fff7ed;border-color:#fed7aa}}
  .problem h2{{color:#c2410c}}
  .features{{display:flex;flex-direction:column;gap:14px}}
  .feature{{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #f3f4f6}}
  .feature:last-child{{border-bottom:none}}
  .feature-icon{{font-size:1.4rem;min-width:28px}}
  .pricing-box{{background:var(--primary);color:white;border-radius:var(--r);padding:28px;margin-bottom:20px;text-align:center}}
  .pricing-box .price{{font-size:3rem;font-weight:800;margin:12px 0}}
  .pricing-box .price small{{font-size:1rem;opacity:.8}}
  .pricing-box p{{opacity:.9;font-size:1rem}}
  .cta-section{{text-align:center;margin:28px 0}}
  .cta-section h2{{font-size:1.3rem;margin-bottom:20px}}
  .cta-btn{{
    display:inline-block;width:100%;max-width:400px;padding:20px 32px;
    background:#fbbf24;color:#1a1a2e;border:none;border-radius:12px;
    font-size:1.15rem;font-weight:800;cursor:pointer;
    box-shadow:0 6px 20px #fbbf2455;transition:all .2s;font-family:inherit
  }}
  .cta-btn:hover{{transform:translateY(-2px);box-shadow:0 10px 28px #fbbf2466}}
  .cta-btn:disabled{{background:#9ca3af;box-shadow:none;cursor:not-allowed;transform:none}}
  .guarantee{{display:flex;align-items:center;gap:8px;justify-content:center;color:var(--green);font-size:.9rem;margin-top:14px;font-weight:600}}
  .social-proof{{background:#f0fdf4;border-color:#bbf7d0}}
  .footer{{text-align:center;color:var(--gray);font-size:.8rem;padding:24px;border-top:1px solid #e5e7eb}}
</style>
</head>
<body>
<div class="header">
  <h1>{project_name}</h1>
  <div class="subtitle">{copy.get('hero_subtitle','')}</div>
</div>
<div class="container">

  <div class="section problem">
    <h2>🤔 {copy.get('hero_title','')}</h2>
    <p style="line-height:1.7;font-size:1rem">{copy.get('problem_statement','')}</p>
  </div>

  <div class="section">
    <h2>💡 הפתרון שלנו</h2>
    <p style="line-height:1.7;font-size:1rem;margin-bottom:20px">{copy.get('value_proposition','')}</p>
    <div class="features">{features_html}</div>
  </div>

  <div class="pricing-box">
    <p>מחיר מיוחד להצטרפות</p>
    <div class="price">{price_ils:,}<small> ₪</small></div>
    <p>תשלום חד-פעמי • ללא הפתעות</p>
  </div>

  <div class="section social-proof">
    <h2>💬 מה אומרים הלקוחות</h2>
    <p style="font-style:italic;line-height:1.7">"{copy.get('social_proof','')}"</p>
  </div>

  <div class="cta-section">
    <h2>{copy.get('cta_headline', cta_text)}</h2>
    <button class="cta-btn" id="cta-btn" onclick="handlePayment()">{cta_text}</button>
    <div class="guarantee">🔒 {copy.get('guarantee_text','ביטחון מלא')}</div>
  </div>

</div>
<div class="footer">
  {project_name} © {datetime.now().year} | מופעל ע"י AI Company OS
</div>
<script>
{payment_js}
</script>
</body>
</html>"""


# ── Public API ─────────────────────────────────────────────────────────────

def generate_page(
    group_id: str,
    title: str,
    description: str,
    target_audience: str,
    features: list[str],
    price_ils: int,
    payment_provider: str = "green_invoice",
    payment_config: dict | None = None,
    cta_text: str = "התחל עכשיו",
    slug: str | None = None,
    primary_color: str = "#1450A3",
) -> str:
    """
    Generate a complete proposal page for a project.
    Returns the public URL.
    """
    payment_config = payment_config or {}

    group = db().table("groups").select("name").eq("id", group_id).single().execute().data
    project_name = group["name"] if group else title

    if not slug:
        slug = re.sub(r'[^a-z0-9-]', '', project_name.lower().replace(' ', '-'))[:40]
        slug = f"{slug}-{group_id[:6]}"

    logger.info(f"Generating proposal page for {project_name} (slug: {slug})")

    # Generate copy
    copy = _generate_copy(project_name, description, target_audience, features, price_ils, cta_text, payment_provider)

    # Build HTML
    html = _build_html(project_name, copy, price_ils, cta_text, payment_provider, payment_config, primary_color)

    # Save to Supabase
    url = f"{RAILWAY_BASE}/proposals/{slug}"

    existing = db().table("proposal_pages").select("id").eq("group_id", group_id).single().execute().data
    if existing:
        db().table("proposal_pages").update({
            "html_content": html,
            "title": title,
            "payment_provider": payment_provider,
            "price_ils": price_ils,
            "cta_text": cta_text,
            "url": url,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("group_id", group_id).execute()
    else:
        db().table("proposal_pages").insert({
            "group_id": group_id,
            "slug": slug,
            "title": title,
            "html_content": html,
            "payment_provider": payment_provider,
            "price_ils": price_ils,
            "cta_text": cta_text,
            "published": True,
            "url": url,
        }).execute()

    logger.info(f"Proposal page saved: {url}")

    send_message(
        "proposal_generator", "ceo",
        f"📄 עמוד הצעה נוצר: {project_name}",
        f"עמוד הצעת מחיר נוצר אוטונומית:\n{url}\nמחיר: {price_ils:,}₪",
        priority="medium"
    )

    return url


def get_page_html(slug: str) -> str | None:
    """Retrieve stored HTML for serving via FastAPI/Railway."""
    row = db().table("proposal_pages").select("html_content").eq("slug", slug).eq("published", True).single().execute().data
    return row["html_content"] if row else None
