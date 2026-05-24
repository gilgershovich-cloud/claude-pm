import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { getContent } from "@/lib/content";
import { OG_LOCALE, type Locale, localePath } from "@/lib/i18n";
import { PORTFOLIO_ITEMS } from "@/lib/portfolio";

const HE_URL = new URL(localePath("he"), SITE.baseUrl).toString();
const EN_URL = new URL(localePath("en"), SITE.baseUrl).toString();

/** hreflang map shared by both locales (x-default points to Hebrew root). */
const LANGUAGES = {
  he: HE_URL,
  en: EN_URL,
  "x-default": HE_URL,
};

export function buildMetadata(locale: Locale): Metadata {
  const c = getContent(locale);
  const canonical = locale === "he" ? HE_URL : EN_URL;
  const ogLocale = OG_LOCALE[locale];
  const altLocale = locale === "he" ? OG_LOCALE.en : OG_LOCALE.he;

  return {
    metadataBase: new URL(SITE.baseUrl),
    title: c.metaTitle,
    description: c.metaDescription,
    applicationName: SITE.brand[locale],
    keywords:
      locale === "he"
        ? [
            "עריכת וידאו",
            "עריכת וידאו לאירועים",
            "סרט חתונה",
            "עריכת סרטי חתונה",
            "בר מצווה",
            "בת מצווה",
            "אירועים עסקיים",
            "היילייטים",
            "color grading",
          ]
        : [
            "video editing",
            "event video editing",
            "wedding film",
            "wedding video editor",
            "bar mitzvah",
            "bat mitzvah",
            "corporate event video",
            "highlight reel",
            "color grading",
          ],
    alternates: {
      canonical,
      languages: LANGUAGES,
    },
    openGraph: {
      type: "website",
      siteName: SITE.brand[locale],
      title: c.metaTitle,
      description: c.metaDescription,
      url: canonical,
      locale: ogLocale,
      alternateLocale: altLocale,
      images: [
        {
          url: "/og-image.svg",
          width: 1200,
          height: 630,
          alt: c.ogAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: c.metaTitle,
      description: c.metaDescription,
      images: ["/og-image.svg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    category: locale === "he" ? "וידאו" : "video",
  };
}

type JsonLd = Record<string, unknown>;

/** ProfessionalService / LocalBusiness for local SEO. */
export function localBusinessJsonLd(locale: Locale): JsonLd {
  const c = getContent(locale);
  const sameAs = Object.values(SITE.social).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": ["ProfessionalService", "LocalBusiness"],
    "@id": `${SITE.baseUrl}/#business`,
    name: SITE.brand[locale],
    description: c.metaDescription,
    url: locale === "he" ? HE_URL : EN_URL,
    image: `${SITE.baseUrl}/og-image.svg`,
    telephone: SITE.phoneE164,
    email: SITE.email,
    priceRange: SITE.priceRange,
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.addressLocality[locale],
      addressCountry: SITE.addressCountry,
    },
    areaServed: SITE.areaServed[locale].map((name) => ({
      "@type": "AdministrativeArea",
      name,
    })),
    serviceType:
      locale === "he"
        ? "עריכת וידאו לאירועים"
        : "Event video editing",
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function breadcrumbJsonLd(locale: Locale): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: SITE.shortName[locale],
        item: locale === "he" ? HE_URL : EN_URL,
      },
    ],
  };
}

export function faqJsonLd(locale: Locale): JsonLd {
  const c = getContent(locale);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/** VideoObject for the showreel + any portfolio items that have a video URL. */
export function videoJsonLd(locale: Locale): JsonLd[] {
  const c = getContent(locale);
  const showreel: JsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: `${SITE.brand[locale]} — ${c.hero.showreelLabel}`,
    description: c.metaDescription,
    thumbnailUrl: [`${SITE.baseUrl}/showreel-poster.svg`],
    uploadDate: "2026-01-01",
    contentUrl: `${SITE.baseUrl}/showreel.mp4`,
  };

  const items = PORTFOLIO_ITEMS.filter((i) => i.videoUrl).map((i) => ({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: i.title[locale],
    description: i.alt[locale],
    thumbnailUrl: [`${SITE.baseUrl}${i.thumbnail}`],
    uploadDate: i.date,
    contentUrl: i.videoUrl,
    ...(i.durationSeconds ? { duration: `PT${i.durationSeconds}S` } : {}),
  }));

  return [showreel, ...items];
}

/** Serializes a JSON-LD object safely for embedding in a <script> tag. */
export function jsonLdScript(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
