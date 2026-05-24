"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { SiteContent } from "@/lib/content";

type Status = "idle" | "sending" | "success" | "error";

export function ContactForm({
  locale,
  labels,
  whatsappBase,
}: {
  locale: Locale;
  labels: SiteContent["contact"]["form"];
  whatsappBase: string; // wa.me/<number> without text
}) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  // Fallback path: open WhatsApp with the typed details prefilled.
  function whatsappFallback() {
    const form = document.getElementById("contact-form") as HTMLFormElement | null;
    if (!form) return;
    const d = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const lines = [
      `${labels.name}: ${d.name ?? ""}`,
      `${labels.phone}: ${d.phone ?? ""}`,
      `${labels.eventType}: ${d.eventType ?? ""}`,
      `${labels.message}: ${d.message ?? ""}`,
    ];
    const url = `${whatsappBase}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const inputClass =
    "w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30";

  return (
    <form
      id="contact-form"
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            {labels.name}
          </span>
          <input name="name" required autoComplete="name" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            {labels.phone}
          </span>
          <input
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            dir="ltr"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            {labels.email}
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            {labels.eventType}
          </span>
          <input name="eventType" className={inputClass} />
        </label>
      </div>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          {labels.message}
        </span>
        <textarea name="message" rows={4} className={inputClass} />
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-accent-strong disabled:opacity-60"
        >
          <Send className="size-4" aria-hidden="true" />
          {status === "sending" ? labels.sending : labels.submit}
        </button>
        <button
          type="button"
          onClick={whatsappFallback}
          className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-semibold text-ink transition hover:bg-cream"
        >
          <MessageCircle className="size-4 text-[#25D366]" aria-hidden="true" />
          {labels.orWhatsapp}
        </button>
      </div>

      {status === "success" ? (
        <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-green-800">
          {labels.success}
        </p>
      ) : null}
      {status === "error" ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-red-800">
          {labels.error}
        </p>
      ) : null}
    </form>
  );
}
