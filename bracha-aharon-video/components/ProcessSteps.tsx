import type { Locale } from "@/lib/i18n";
import { getContent } from "@/lib/content";
import { SectionHeading } from "@/components/SectionHeading";

export function ProcessSteps({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  return (
    <section id="process" className="section-pad bg-surface">
      <div className="container-page">
        <SectionHeading title={c.process.heading} subtitle={c.process.subheading} />
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {c.process.steps.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-line bg-cream/40 p-6"
            >
              <span className="grid size-10 place-items-center rounded-full bg-accent font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
