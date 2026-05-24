import { Quote } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { getContent } from "@/lib/content";
import { SectionHeading } from "@/components/SectionHeading";

export function Testimonials({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  return (
    <section className="section-pad bg-night text-white">
      <div className="container-page">
        <SectionHeading title={c.testimonials.heading} light />
        <div className="grid gap-6 md:grid-cols-3">
          {c.testimonials.items.map((item) => (
            <figure
              key={item.name}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <Quote className="size-8 text-accent" aria-hidden="true" />
              <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-white/85">
                {item.quote}
              </blockquote>
              <figcaption className="mt-5 border-t border-white/10 pt-4">
                <span className="block font-semibold">{item.name}</span>
                <span className="text-sm text-white/55">{item.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
