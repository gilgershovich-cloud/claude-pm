import { Check } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { getContent } from "@/lib/content";
import { SectionHeading } from "@/components/SectionHeading";

export function Packages({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  return (
    <section id="packages" className="section-pad bg-cream/50">
      <div className="container-page">
        <SectionHeading title={c.packages.heading} subtitle={c.packages.subheading} />
        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {c.packages.items.map((pkg) => (
            <div
              key={pkg.name}
              className={`flex flex-col rounded-2xl border p-7 transition ${
                pkg.highlighted
                  ? "border-accent bg-surface shadow-xl ring-1 ring-accent/30"
                  : "border-line bg-surface"
              }`}
            >
              <h3 className="text-xl font-bold text-ink">{pkg.name}</h3>
              <p className="mt-2 text-2xl font-extrabold text-accent">{pkg.price}</p>
              <p className="mt-2 text-muted">{pkg.description}</p>
              <ul className="mt-5 flex-1 space-y-3">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-ink">
                    <Check
                      className="mt-0.5 size-5 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className={`mt-7 inline-flex items-center justify-center rounded-full px-5 py-3 font-semibold transition ${
                  pkg.highlighted
                    ? "bg-accent text-white hover:bg-accent-strong"
                    : "border border-line text-ink hover:bg-cream"
                }`}
              >
                {c.cta.primary}
              </a>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted">
          {c.packages.note}
        </p>
      </div>
    </section>
  );
}
