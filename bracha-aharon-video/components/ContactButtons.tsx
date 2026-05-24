import { MessageCircle, Phone } from "lucide-react";
import { SITE, whatsappLink, telLink } from "@/lib/site";
import type { Locale } from "@/lib/i18n";
import { getContent } from "@/lib/content";

export function ContactButtons({
  locale,
  variant = "solid",
}: {
  locale: Locale;
  variant?: "solid" | "onDark";
}) {
  const c = getContent(locale);
  const waMessage =
    locale === "he"
      ? "היי ברכה, אשמח לקבל פרטים על עריכת וידאו לאירוע שלי"
      : "Hi Bracha, I'd love details about video editing for my event";

  const callClasses =
    variant === "onDark"
      ? "border-white/25 text-white hover:bg-white/10"
      : "border-line text-ink hover:bg-cream";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={whatsappLink(waMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 font-semibold text-white shadow-sm transition hover:brightness-95"
      >
        <MessageCircle className="size-5" aria-hidden="true" />
        {c.cta.whatsapp}
      </a>
      <a
        href={telLink}
        className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 font-semibold transition ${callClasses}`}
      >
        <Phone className="size-5" aria-hidden="true" />
        <span>{c.cta.call}</span>
        <span dir="ltr" className="tabular-nums opacity-80">
          {SITE.phoneDisplay}
        </span>
      </a>
    </div>
  );
}
