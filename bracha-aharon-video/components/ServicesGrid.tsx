import type { Locale } from "@/lib/i18n";
import { getContent } from "@/lib/content";
import { SectionHeading } from "@/components/SectionHeading";
import { ServiceGlyph } from "@/components/icons";

export function ServicesGrid({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  return (
    <section id="services" className="section-pad bg-surface">
      <div className="container-page">
        <SectionHeading title={c.services.heading} subtitle={c.services.subheading} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {c.services.items.map((s) => (
            <div
              key={s.title}
              className="group rounded-2xl border border-line bg-cream/40 p-6 transition hover:border-accent/50 hover:shadow-md"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-ink text-accent transition group-hover:bg-accent group-hover:text-white">
                <ServiceGlyph name={s.icon} className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-ink">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
