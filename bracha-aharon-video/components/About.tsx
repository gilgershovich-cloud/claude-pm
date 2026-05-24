import { Clapperboard } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { getContent } from "@/lib/content";

export function About({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  return (
    <section id="about" className="section-pad bg-surface">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        <div
          className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-3xl border border-line"
          style={{
            background:
              "radial-gradient(120% 120% at 30% 20%, #2a2a36 0%, #15151d 60%, #0c0c11 100%)",
          }}
          data-placeholder="portrait"
        >
          <Clapperboard className="size-20 text-accent/80" aria-hidden="true" />
          <span className="absolute bottom-4 text-xs uppercase tracking-widest text-white/40">
            {SITE_PLACEHOLDER_LABEL[locale]}
          </span>
        </div>

        <div>
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {c.about.heading}
          </h2>
          {c.about.body.map((p, i) => (
            <p key={i} className="mt-4 text-lg leading-relaxed text-muted">
              {p}
            </p>
          ))}

          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-ink">
              {c.about.toolsLabel}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {c.about.tools.map((tool) => (
                <li
                  key={tool}
                  className="rounded-full border border-line bg-cream px-3 py-1.5 text-sm text-ink"
                >
                  {tool}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const SITE_PLACEHOLDER_LABEL: Record<Locale, string> = {
  he: "תמונת פורטרט — להחלפה",
  en: "Portrait photo — replace",
};
