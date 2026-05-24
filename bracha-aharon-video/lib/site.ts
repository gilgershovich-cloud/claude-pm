// Central place for business details. Replace PLACEHOLDER values with the real
// data before launch — these are referenced by contact buttons, footer and JSON-LD.

export const SITE = {
  // Production origin (used for canonical URLs, OG, sitemap). PLACEHOLDER.
  baseUrl: "https://www.bracha-aharon.co.il",

  brand: {
    he: "ברכה אהרון – עריכת וידאו לאירועים",
    en: "Bracha Aharon – Event Video Editing",
  },
  shortName: {
    he: "ברכה אהרון",
    en: "Bracha Aharon",
  },

  // Contact — PLACEHOLDERS. Phone in international format for tel:/wa.me.
  phoneDisplay: "050-000-0000",
  phoneE164: "+972500000000", // used for tel: and wa.me links
  whatsappNumber: "972500000000", // wa.me/<this>
  email: "hello@bracha-aharon.co.il",

  // Social — PLACEHOLDERS (full URLs). Empty string hides the link.
  social: {
    instagram: "https://instagram.com/", // PLACEHOLDER
    facebook: "", // PLACEHOLDER (optional)
    youtube: "https://youtube.com/", // PLACEHOLDER
    tiktok: "", // PLACEHOLDER (optional)
  },

  // Local SEO — service area. PLACEHOLDERS.
  areaServed: {
    he: ["מרכז", "תל אביב", "ירושלים", "השרון", "כל הארץ"],
    en: ["Central Israel", "Tel Aviv", "Jerusalem", "Sharon", "Nationwide"],
  },
  addressLocality: {
    he: "תל אביב",
    en: "Tel Aviv",
  },
  addressCountry: "IL",

  priceRange: "₪₪",
} as const;

export type SocialKey = keyof typeof SITE.social;

/** Builds a wa.me deep link with an optional prefilled message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${SITE.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Builds a mailto: link with optional subject/body. */
export function mailtoLink(subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString();
  return `mailto:${SITE.email}${qs ? `?${qs}` : ""}`;
}

/** tel: link from the E.164 number. */
export const telLink = `tel:${SITE.phoneE164}`;
