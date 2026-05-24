import type { Localized } from "@/lib/i18n";

export type CategoryId =
  | "weddings"
  | "religious"
  | "corporate"
  | "commercial";

export interface PortfolioCategory {
  id: CategoryId;
  label: Localized;
  order: number;
}

export interface PortfolioItem {
  id: string;
  title: Localized;
  category: CategoryId;
  /** Short event-type tag shown on the card. */
  eventType: Localized;
  /** Thumbnail in /public/portfolio. PLACEHOLDER until real stills are added. */
  thumbnail: string;
  /** Optional external video (YouTube/Vimeo). Empty = no playback yet. */
  videoUrl: string;
  /** ISO date of the work — used for sorting and lastModified. */
  date: string;
  durationSeconds?: number;
  featured?: boolean;
  /** Descriptive alt text for the thumbnail (localized, important for SEO/a11y). */
  alt: Localized;
}

// Adding a category object automatically adds a filter tab in the gallery.
export const CATEGORIES: PortfolioCategory[] = [
  {
    id: "weddings",
    order: 1,
    label: { he: "חתונות", en: "Weddings" },
  },
  {
    id: "religious",
    order: 2,
    label: { he: "בר/בת מצווה ואירועי דת", en: "Bar/Bat Mitzvah & Religious" },
  },
  {
    id: "corporate",
    order: 3,
    label: { he: "אירועים עסקיים", en: "Corporate Events" },
  },
  {
    id: "commercial",
    order: 4,
    label: { he: "קליפים והפקות", en: "Clips & Productions" },
  },
];

// PLACEHOLDER works. Replace thumbnails (in /public/portfolio) and videoUrl
// values with real projects. Adding an item here makes it appear in the gallery.
export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: "w-01",
    category: "weddings",
    featured: true,
    title: { he: "נועה ואיתי — סרט חתונה", en: "Noa & Itai — Wedding Film" },
    eventType: { he: "חתונה", en: "Wedding" },
    thumbnail: "/portfolio/placeholder-wedding-1.svg",
    videoUrl: "",
    date: "2026-04-18",
    durationSeconds: 210,
    alt: {
      he: "תמונת מסך מסרט חתונה — זוג רוקד בחופה מוארת",
      en: "Still from a wedding film — couple dancing under a lit chuppah",
    },
  },
  {
    id: "w-02",
    category: "weddings",
    title: { he: "הדר ויונתן — היילייטים", en: "Hadar & Yonatan — Highlights" },
    eventType: { he: "היילייטים", en: "Highlights" },
    thumbnail: "/portfolio/placeholder-wedding-2.svg",
    videoUrl: "",
    date: "2026-03-02",
    durationSeconds: 90,
    alt: {
      he: "תמונת מסך מסרטון היילייטים של חתונה בשקיעה",
      en: "Still from a wedding highlights reel at sunset",
    },
  },
  {
    id: "r-01",
    category: "religious",
    featured: true,
    title: { he: "בר מצווה — דניאל", en: "Bar Mitzvah — Daniel" },
    eventType: { he: "בר מצווה", en: "Bar Mitzvah" },
    thumbnail: "/portfolio/placeholder-religious-1.svg",
    videoUrl: "",
    date: "2026-02-11",
    durationSeconds: 150,
    alt: {
      he: "תמונת מסך מאירוע בר מצווה עם בני המשפחה",
      en: "Still from a bar mitzvah celebration with family",
    },
  },
  {
    id: "r-02",
    category: "religious",
    title: { he: "בת מצווה — שירה", en: "Bat Mitzvah — Shira" },
    eventType: { he: "בת מצווה", en: "Bat Mitzvah" },
    thumbnail: "/portfolio/placeholder-religious-2.svg",
    videoUrl: "",
    date: "2026-01-20",
    durationSeconds: 120,
    alt: {
      he: "תמונת מסך מאירוע בת מצווה חגיגי",
      en: "Still from a festive bat mitzvah event",
    },
  },
  {
    id: "c-01",
    category: "corporate",
    featured: true,
    title: { he: "כנס שנתי — חברת הייטק", en: "Annual Conference — Tech Company" },
    eventType: { he: "כנס", en: "Conference" },
    thumbnail: "/portfolio/placeholder-corporate-1.svg",
    videoUrl: "",
    date: "2026-05-05",
    durationSeconds: 180,
    alt: {
      he: "תמונת מסך מכנס עסקי עם במה ותאורה",
      en: "Still from a corporate conference with stage and lighting",
    },
  },
  {
    id: "c-02",
    category: "corporate",
    title: { he: "ערב גאלה — סיכום שנה", en: "Gala Evening — Year in Review" },
    eventType: { he: "גאלה", en: "Gala" },
    thumbnail: "/portfolio/placeholder-corporate-2.svg",
    videoUrl: "",
    date: "2026-04-01",
    durationSeconds: 140,
    alt: {
      he: "תמונת מסך מערב גאלה עסקי אלגנטי",
      en: "Still from an elegant corporate gala evening",
    },
  },
  {
    id: "m-01",
    category: "commercial",
    featured: true,
    title: { he: "קליפ מותג — קמפיין", en: "Brand Clip — Campaign" },
    eventType: { he: "קליפ מסחרי", en: "Commercial" },
    thumbnail: "/portfolio/placeholder-commercial-1.svg",
    videoUrl: "",
    date: "2026-03-22",
    durationSeconds: 60,
    alt: {
      he: "תמונת מסך מקליפ מסחרי צבעוני למותג",
      en: "Still from a colorful brand commercial clip",
    },
  },
  {
    id: "m-02",
    category: "commercial",
    title: { he: "סרטון לרשתות — ריל", en: "Social Reel" },
    eventType: { he: "ריל", en: "Reel" },
    thumbnail: "/portfolio/placeholder-commercial-2.svg",
    videoUrl: "",
    date: "2026-02-28",
    durationSeconds: 30,
    alt: {
      he: "תמונת מסך מריל קצר לרשתות חברתיות",
      en: "Still from a short social-media reel",
    },
  },
];

export function sortedCategories(): PortfolioCategory[] {
  return [...CATEGORIES].sort((a, b) => a.order - b.order);
}

export function itemsByCategory(category: CategoryId | "all"): PortfolioItem[] {
  const items =
    category === "all"
      ? PORTFOLIO_ITEMS
      : PORTFOLIO_ITEMS.filter((i) => i.category === category);
  return [...items].sort((a, b) => (a.date < b.date ? 1 : -1));
}
