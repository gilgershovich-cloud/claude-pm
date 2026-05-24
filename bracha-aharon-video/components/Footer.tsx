import Link from "next/link";
import { Mail, Phone, Clapperboard } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { getContent } from "@/lib/content";
import { SITE, telLink, mailtoLink } from "@/lib/site";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { InstagramIcon, FacebookIcon, YoutubeIcon } from "@/components/SocialIcons";

export function Footer({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  const year = new Date().getFullYear();

  const socials = [
    { href: SITE.social.instagram, Icon: InstagramIcon, label: "Instagram" },
    { href: SITE.social.facebook, Icon: FacebookIcon, label: "Facebook" },
    { href: SITE.social.youtube, Icon: YoutubeIcon, label: "YouTube" },
  ].filter((s) => s.href);

  return (
    <footer className="bg-night text-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div>
          <Link href={localePath(locale)} className="flex items-center gap-2 font-bold">
            <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-accent">
              <Clapperboard className="size-5" aria-hidden="true" />
            </span>
            {SITE.brand[locale]}
          </Link>
          <p className="mt-4 max-w-sm leading-relaxed text-white/60">
            {c.footer.tagline}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">
            {c.footer.quickLinks}
          </h3>
          <ul className="mt-4 space-y-2">
            {c.nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-white/60 transition hover:text-white">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">
            {c.footer.contactLabel}
          </h3>
          <ul className="mt-4 space-y-3">
            <li>
              <a
                href={telLink}
                className="inline-flex items-center gap-2 text-white/70 transition hover:text-white"
              >
                <Phone className="size-4 text-accent" aria-hidden="true" />
                <span dir="ltr" className="tabular-nums">
                  {SITE.phoneDisplay}
                </span>
              </a>
            </li>
            <li>
              <a
                href={mailtoLink()}
                className="inline-flex items-center gap-2 text-white/70 transition hover:text-white"
              >
                <Mail className="size-4 text-accent" aria-hidden="true" />
                {SITE.email}
              </a>
            </li>
          </ul>

          {socials.length ? (
            <>
              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-white/80">
                {c.footer.followLabel}
              </h3>
              <div className="mt-3 flex gap-3">
                {socials.map(({ href, Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-accent"
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-sm text-white/50 sm:flex-row">
          <p>
            © {year} {SITE.brand[locale]}. {c.footer.rights}
          </p>
          <LanguageSwitcher locale={locale} className="text-white/60 hover:text-white" />
        </div>
      </div>
    </footer>
  );
}
