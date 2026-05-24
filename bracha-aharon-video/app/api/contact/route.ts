import { SITE } from "@/lib/site";
import { insertLead, isDatabaseConfigured, type Lead } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ContactPayload {
  name?: string;
  phone?: string;
  email?: string;
  eventType?: string;
  message?: string;
  locale?: string;
}

export async function POST(request: Request) {
  let body: ContactPayload;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = body.name?.trim();
  const phone = body.phone?.trim();
  if (!name || !phone) {
    return Response.json({ error: "missing_fields" }, { status: 422 });
  }

  if (!isDatabaseConfigured()) {
    // Persisting leads is required, so refuse rather than silently dropping.
    // (The client offers a WhatsApp fallback for this case.)
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  let lead: Lead;
  try {
    lead = await insertLead({
      name,
      phone,
      email: body.email?.trim() || null,
      eventType: body.eventType?.trim() || null,
      message: body.message?.trim() || null,
      locale: body.locale?.trim() || null,
    });
  } catch (err) {
    console.error("[contact] failed to save lead:", err);
    return Response.json({ error: "save_failed" }, { status: 502 });
  }

  // Best-effort notification — never fail the request if the email doesn't send,
  // since the lead is already safely stored.
  await sendNotification(lead).catch((err) =>
    console.error("[contact] notification failed:", err),
  );

  return Response.json({ ok: true });
}

async function sendNotification(lead: Lead): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // notifications are optional / not configured

  const to = process.env.CONTACT_TO ?? SITE.email;
  const from = process.env.CONTACT_FROM ?? "onboarding@resend.dev";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: lead.email || undefined,
      subject: `New lead — ${lead.name}`,
      text: [
        `Name: ${lead.name}`,
        `Phone: ${lead.phone}`,
        `Email: ${lead.email ?? ""}`,
        `Event type: ${lead.eventType ?? ""}`,
        `Locale: ${lead.locale ?? ""}`,
        `Received: ${lead.createdAt}`,
        "",
        lead.message ?? "",
      ].join("\n"),
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend responded ${res.status}`);
  }
}
