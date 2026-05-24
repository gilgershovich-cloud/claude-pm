import type { Locale } from "@/lib/i18n";

export interface NavItem {
  href: string; // in-page anchor, e.g. "#portfolio"
  label: string;
}

export interface Service {
  title: string;
  description: string;
  icon: ServiceIcon;
}

export type ServiceIcon =
  | "film"
  | "sparkles"
  | "palette"
  | "scissors"
  | "share"
  | "music";

export interface Stat {
  value: string;
  label: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export interface ProcessStep {
  title: string;
  description: string;
}

export interface Package {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface SiteContent {
  metaTitle: string;
  metaDescription: string;
  ogAlt: string;

  nav: NavItem[];
  cta: {
    primary: string;
    whatsapp: string;
    call: string;
    quote: string;
  };

  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    showreelLabel: string;
  };

  stats: Stat[];

  services: {
    heading: string;
    subheading: string;
    items: Service[];
  };

  portfolio: {
    heading: string;
    subheading: string;
    all: string;
    watch: string;
    comingSoon: string;
  };

  about: {
    heading: string;
    body: string[];
    toolsLabel: string;
    tools: string[];
  };

  testimonials: {
    heading: string;
    items: Testimonial[];
  };

  process: {
    heading: string;
    subheading: string;
    steps: ProcessStep[];
  };

  packages: {
    heading: string;
    subheading: string;
    items: Package[];
    note: string;
  };

  faq: {
    heading: string;
    items: Faq[];
  };

  contact: {
    heading: string;
    subheading: string;
    areaServedLabel: string;
    form: {
      name: string;
      phone: string;
      email: string;
      eventType: string;
      message: string;
      submit: string;
      sending: string;
      success: string;
      error: string;
      orWhatsapp: string;
    };
  };

  footer: {
    tagline: string;
    rights: string;
    quickLinks: string;
    contactLabel: string;
    followLabel: string;
    switchLanguage: string;
  };
}

const he: SiteContent = {
  metaTitle: "ברכה אהרון – עריכת וידאו לאירועים | סרטי חתונה, בר מצווה ואירועים",
  metaDescription:
    "ברכה אהרון – עורכת וידאו לאירועים. סרטי חתונה, בר/בת מצווה, אירועים עסקיים וקליפים, בעריכה קולנועית ומרגשת. צפו בעבודות אחרונות וקבלו הצעת מחיר.",
  ogAlt: "ברכה אהרון – עריכת וידאו לאירועים",

  nav: [
    { href: "#services", label: "שירותים" },
    { href: "#portfolio", label: "עבודות" },
    { href: "#about", label: "אודות" },
    { href: "#process", label: "תהליך" },
    { href: "#faq", label: "שאלות נפוצות" },
    { href: "#contact", label: "יצירת קשר" },
  ],
  cta: {
    primary: "לקבלת הצעת מחיר",
    whatsapp: "וואטסאפ",
    call: "התקשרו",
    quote: "הצעת מחיר",
  },

  hero: {
    eyebrow: "עריכת וידאו לאירועים",
    title: "הופכים את האירוע שלכם לסרט שמרגש שוב ושוב",
    subtitle:
      "עריכה קולנועית לחתונות, בר/בת מצווה, אירועים עסקיים וקליפים. כל רגע מקבל קצב, צבע וסיפור — כדי שתרצו לצפות בו שוב ולשתף.",
    showreelLabel: "סרטון תקציר",
  },

  stats: [
    { value: "+10", label: "שנות ניסיון" },
    { value: "+500", label: "אירועים נערכו" },
    { value: "100%", label: "לקוחות מרוצים" },
  ],

  services: {
    heading: "מה אני מציעה",
    subheading: "שירותי עריכה מקצועיים, מותאמים לכל סוג אירוע ולכל פלטפורמה.",
    items: [
      {
        icon: "film",
        title: "סרטי אירוע מלאים",
        description:
          "עריכה מלאה של האירוע — מקבלת הפנים ועד הריקודים, עם מבנה סיפורי וקצב מדויק.",
      },
      {
        icon: "sparkles",
        title: "סרטוני היילייטים",
        description:
          "תקציר קצר ועוצמתי של 1–3 דקות שמרכז את הרגעים הכי יפים — מושלם לשיתוף.",
      },
      {
        icon: "palette",
        title: "Color Grading",
        description:
          "תיקוני צבע ותאורה קולנועיים שנותנים לחומרים מראה אחיד, חם ומקצועי.",
      },
      {
        icon: "scissors",
        title: "עריכה ותזמון מוזיקלי",
        description:
          "חיתוך מדויק לקצב המוזיקה, סנכרון רגעים וזרימה שמחזיקה את הצופה עד הסוף.",
      },
      {
        icon: "share",
        title: "גרסאות לרשתות",
        description:
          "פורמטים אנכיים לאינסטגרם וטיקטוק, רילים וטיזרים שמותאמים לכל פלטפורמה.",
      },
      {
        icon: "music",
        title: "כתוביות ופסקול",
        description:
          "בחירת מוזיקה מותאמת, כתוביות ומיקס סאונד נקי שמשלים את החוויה.",
      },
    ],
  },

  portfolio: {
    heading: "עבודות אחרונות",
    subheading: "מבחר עבודות לפי סוג אירוע. בחרו קטגוריה כדי לצפות.",
    all: "הכל",
    watch: "צפייה",
    comingSoon: "בקרוב",
  },

  about: {
    heading: "נעים להכיר, אני ברכה",
    body: [
      "אני עורכת וידאו לאירועים עם תשוקה אמיתית לסיפורים. כל אירוע הוא יום אחד ומיוחד — והתפקיד שלי הוא לארוז אותו לסרט שמחזיר אתכם בדיוק לרגשות של אותו רגע.",
      "אני עובדת בקרבה ללקוחות ולצלמים, מקשיבה לסיפור שמאחורי האירוע, ובונה עריכה אישית עם קצב, צבע ומוזיקה שמתאימים בדיוק לכם.",
    ],
    toolsLabel: "כלים שאני עובדת איתם",
    tools: ["DaVinci Resolve", "Adobe Premiere Pro", "After Effects", "Audition"],
  },

  testimonials: {
    heading: "מה הלקוחות אומרים",
    items: [
      {
        quote:
          "ברכה הפכה את החתונה שלנו לסרט שאנחנו צופים בו שוב ושוב. כל פריים מדויק ומרגש.",
        name: "נועה ואיתי",
        role: "חתונה",
      },
      {
        quote:
          "מקצועית, קשובה ועומדת בזמנים. סרטון ההיילייטים קיבל המון תגובות ברשתות.",
        name: "משפחת לוי",
        role: "בר מצווה",
      },
      {
        quote:
          "ערכה לנו סרט סיכום לכנס השנתי — איכותי, מהיר ומדויק למסר של החברה.",
        name: "חברת הייטק",
        role: "אירוע עסקי",
      },
    ],
  },

  process: {
    heading: "איך זה עובד",
    subheading: "תהליך פשוט ושקוף מהפנייה ועד הסרט המוגמר.",
    steps: [
      {
        title: "שיחת היכרות",
        description: "מבינים את האירוע, הסגנון והציפיות — ומגבשים הצעת מחיר.",
      },
      {
        title: "קבלת החומרים",
        description: "אתם שולחים את הצילומים, אני בודקת ומסדרת את כל הקבצים.",
      },
      {
        title: "עריכה ראשונה",
        description: "בונה גרסה ראשונה ושולחת לצפייה והערות.",
      },
      {
        title: "מסירה סופית",
        description: "מתקנים יחד, מבצעים color grading ומספקים בכל הפורמטים.",
      },
    ],
  },

  packages: {
    heading: "חבילות",
    subheading: "נקודת התחלה — כל חבילה מותאמת אישית לאירוע שלכם.",
    items: [
      {
        name: "היילייטים",
        price: "החל מ-₪",
        description: "תקציר קצר ועוצמתי לשיתוף ברשתות.",
        features: ["סרטון 1–3 דקות", "Color grading", "גרסה אנכית לרשתות"],
      },
      {
        name: "סרט אירוע מלא",
        price: "החל מ-₪₪",
        description: "החבילה הפופולרית — סיפור מלא של האירוע.",
        features: [
          "סרט מלא + היילייטים",
          "Color grading קולנועי",
          "תזמון מוזיקלי מלא",
          "2 סבבי תיקונים",
        ],
        highlighted: true,
      },
      {
        name: "הפקה מותאמת",
        price: "לפי הצעה",
        description: "אירועים עסקיים, קליפים והפקות מיוחדות.",
        features: ["אפיון מלא", "גרפיקה וכתוביות", "מספר פורמטים"],
      },
    ],
    note: "המחירים נקבעים לפי היקף החומרים ואורך הסרט. צרו קשר להצעה מדויקת.",
  },

  faq: {
    heading: "שאלות נפוצות",
    items: [
      {
        question: "תוך כמה זמן מקבלים את הסרט?",
        answer:
          "בדרך כלל בין שבועיים לארבעה שבועות, בהתאם להיקף החומרים ולעומס. בתיאום מראש אפשר גם אקספרס.",
      },
      {
        question: "אתם גם מצלמים?",
        answer:
          "המיקוד שלי הוא עריכה. אני עובדת מצוין מול צילומים שלכם או של צלם, ויכולה להמליץ על צלמים מנוסים.",
      },
      {
        question: "כמה סבבי תיקונים כלולים?",
        answer:
          "כל חבילה כוללת סבבי תיקונים. נסכם מראש בדיוק מה כלול כדי שתהיו רגועים.",
      },
      {
        question: "באילו פורמטים מקבלים את הסרט?",
        answer:
          "מספקת בכל הפורמטים שצריך — אופקי לצפייה ביתית ואנכי לאינסטגרם וטיקטוק.",
      },
      {
        question: "אפשר מוזיקה ספציפית?",
        answer:
          "בהחלט. נבחר יחד פסקול שמתאים לאווירה, תוך הקפדה על שימוש מורשה במוזיקה.",
      },
    ],
  },

  contact: {
    heading: "בואו נדבר על האירוע שלכם",
    subheading: "השאירו פרטים ואחזור אליכם, או דברו איתי ישירות בוואטסאפ.",
    areaServedLabel: "אזורי שירות",
    form: {
      name: "שם מלא",
      phone: "טלפון",
      email: "אימייל",
      eventType: "סוג האירוע",
      message: "ספרו לי על האירוע",
      submit: "שליחה",
      sending: "שולח...",
      success: "תודה! קיבלתי את הפנייה ואחזור אליכם בהקדם.",
      error: "אופס, משהו השתבש. נסו שוב או פנו בוואטסאפ.",
      orWhatsapp: "או שלחו לי הודעה בוואטסאפ",
    },
  },

  footer: {
    tagline: "עריכת וידאו לאירועים — חתונות, בר/בת מצווה, אירועים עסקיים וקליפים.",
    rights: "כל הזכויות שמורות.",
    quickLinks: "ניווט",
    contactLabel: "יצירת קשר",
    followLabel: "עקבו אחריי",
    switchLanguage: "English",
  },
};

const en: SiteContent = {
  metaTitle: "Bracha Aharon – Event Video Editing | Wedding, Mitzvah & Corporate Films",
  metaDescription:
    "Bracha Aharon – event video editor. Cinematic wedding films, bar/bat mitzvah, corporate event videos and commercial clips. Watch recent work and request a quote.",
  ogAlt: "Bracha Aharon – Event Video Editing",

  nav: [
    { href: "#services", label: "Services" },
    { href: "#portfolio", label: "Work" },
    { href: "#about", label: "About" },
    { href: "#process", label: "Process" },
    { href: "#faq", label: "FAQ" },
    { href: "#contact", label: "Contact" },
  ],
  cta: {
    primary: "Get a quote",
    whatsapp: "WhatsApp",
    call: "Call",
    quote: "Quote",
  },

  hero: {
    eyebrow: "Event Video Editing",
    title: "Turning your event into a film you'll relive again and again",
    subtitle:
      "Cinematic editing for weddings, bar/bat mitzvahs, corporate events and commercial clips. Every moment gets rhythm, color and story — made to rewatch and share.",
    showreelLabel: "Showreel",
  },

  stats: [
    { value: "10+", label: "Years of experience" },
    { value: "500+", label: "Events edited" },
    { value: "100%", label: "Happy clients" },
  ],

  services: {
    heading: "What I offer",
    subheading: "Professional editing tailored to every type of event and platform.",
    items: [
      {
        icon: "film",
        title: "Full event films",
        description:
          "A complete edit of your event — from the reception to the dance floor, with a story arc and precise pacing.",
      },
      {
        icon: "sparkles",
        title: "Highlight reels",
        description:
          "A punchy 1–3 minute recap of the best moments — perfect for sharing.",
      },
      {
        icon: "palette",
        title: "Color grading",
        description:
          "Cinematic color and light correction that gives your footage a consistent, warm, professional look.",
      },
      {
        icon: "scissors",
        title: "Music-driven editing",
        description:
          "Precise cuts to the beat, synced moments and a flow that holds viewers to the end.",
      },
      {
        icon: "share",
        title: "Versions for social",
        description:
          "Vertical formats for Instagram and TikTok, reels and teasers tailored to each platform.",
      },
      {
        icon: "music",
        title: "Captions & sound",
        description:
          "Curated music, captions and a clean sound mix that completes the experience.",
      },
    ],
  },

  portfolio: {
    heading: "Recent work",
    subheading: "A selection of work by event type. Pick a category to watch.",
    all: "All",
    watch: "Watch",
    comingSoon: "Coming soon",
  },

  about: {
    heading: "Hi, I'm Bracha",
    body: [
      "I'm an event video editor with a genuine passion for stories. Every event is one special day — and my job is to wrap it into a film that takes you right back to the emotion of that moment.",
      "I work closely with clients and videographers, listen to the story behind the event, and craft a personal edit with the rhythm, color and music that fit you exactly.",
    ],
    toolsLabel: "Tools I work with",
    tools: ["DaVinci Resolve", "Adobe Premiere Pro", "After Effects", "Audition"],
  },

  testimonials: {
    heading: "What clients say",
    items: [
      {
        quote:
          "Bracha turned our wedding into a film we watch again and again. Every frame is precise and moving.",
        name: "Noa & Itai",
        role: "Wedding",
      },
      {
        quote:
          "Professional, attentive and on time. The highlight reel got tons of reactions on social.",
        name: "The Levi Family",
        role: "Bar Mitzvah",
      },
      {
        quote:
          "Edited our annual conference recap — high quality, fast, and right on message.",
        name: "Tech Company",
        role: "Corporate event",
      },
    ],
  },

  process: {
    heading: "How it works",
    subheading: "A simple, transparent process from first call to finished film.",
    steps: [
      {
        title: "Intro call",
        description: "We discuss the event, style and expectations — and shape a quote.",
      },
      {
        title: "Footage handoff",
        description: "You send the footage; I review and organize all the files.",
      },
      {
        title: "First cut",
        description: "I build a first version and send it for your review and notes.",
      },
      {
        title: "Final delivery",
        description: "We refine together, color grade, and deliver in every format.",
      },
    ],
  },

  packages: {
    heading: "Packages",
    subheading: "A starting point — every package is tailored to your event.",
    items: [
      {
        name: "Highlights",
        price: "From ₪",
        description: "A short, powerful recap to share on social.",
        features: ["1–3 minute film", "Color grading", "Vertical social version"],
      },
      {
        name: "Full event film",
        price: "From ₪₪",
        description: "The popular choice — the full story of your event.",
        features: [
          "Full film + highlights",
          "Cinematic color grading",
          "Full music sync",
          "2 revision rounds",
        ],
        highlighted: true,
      },
      {
        name: "Custom production",
        price: "On request",
        description: "Corporate events, clips and special productions.",
        features: ["Full briefing", "Graphics & captions", "Multiple formats"],
      },
    ],
    note: "Pricing depends on footage volume and film length. Get in touch for an exact quote.",
  },

  faq: {
    heading: "Frequently asked questions",
    items: [
      {
        question: "How long until I get the film?",
        answer:
          "Usually two to four weeks, depending on footage volume and workload. Express delivery is available by arrangement.",
      },
      {
        question: "Do you also film?",
        answer:
          "My focus is editing. I work great with your footage or a videographer's, and can recommend experienced shooters.",
      },
      {
        question: "How many revision rounds are included?",
        answer:
          "Every package includes revision rounds. We'll agree on exactly what's included up front so you're at ease.",
      },
      {
        question: "Which formats do I receive?",
        answer:
          "I deliver in every format you need — horizontal for home viewing and vertical for Instagram and TikTok.",
      },
      {
        question: "Can I choose specific music?",
        answer:
          "Absolutely. We'll pick a soundtrack that fits the mood, while keeping music properly licensed.",
      },
    ],
  },

  contact: {
    heading: "Let's talk about your event",
    subheading: "Leave your details and I'll get back to you, or message me directly on WhatsApp.",
    areaServedLabel: "Service areas",
    form: {
      name: "Full name",
      phone: "Phone",
      email: "Email",
      eventType: "Event type",
      message: "Tell me about your event",
      submit: "Send",
      sending: "Sending...",
      success: "Thanks! I got your message and will get back to you soon.",
      error: "Oops, something went wrong. Try again or reach out on WhatsApp.",
      orWhatsapp: "Or send me a WhatsApp message",
    },
  },

  footer: {
    tagline: "Event video editing — weddings, bar/bat mitzvah, corporate events and clips.",
    rights: "All rights reserved.",
    quickLinks: "Navigation",
    contactLabel: "Contact",
    followLabel: "Follow me",
    switchLanguage: "עברית",
  },
};

export const CONTENT: Record<Locale, SiteContent> = { he, en };

export function getContent(locale: Locale): SiteContent {
  return CONTENT[locale];
}
