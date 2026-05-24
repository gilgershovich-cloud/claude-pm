import Link from "next/link";
import { Clapperboard, MessageCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { getContent } from "@/lib/content";
import { SITE, whatsappLink } from "@/lib/site";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Header({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-surface/85 backdrop-blur-md">
      <nav
        className="container-page flex h-16 items-center justify-between gap-4"
        aria-label={c.footer.quickLinks}
      >
        <Link
          href={localePath(locale)}
          className="flex items-center gap-2 font-bold text-ink"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-ink text-accent">
            <Clapperboard className="size-5" aria-hidden="true" />
          </span>
          <span className="text-base leading-tight">{SITE.shortName[locale]}</span>
        </Link>

        <ul className="hidden items-center gap-6 lg:flex">
          {c.nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-sm font-medium text-muted transition hover:text-ink"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher
            locale={locale}
            className="text-muted transition hover:text-ink"
          />
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={c.cta.whatsapp}
            className="grid size-10 place-items-center rounded-full bg-[#25D366] text-white transition hover:brightness-95 sm:hidden"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
          </a>
          <a
            href="#contact"
            className="hidden rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-strong sm:inline-flex"
          >
            {c.cta.primary}
          </a>
        </div>
      </nav>
    </header>
  );
}
