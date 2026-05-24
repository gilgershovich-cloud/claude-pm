import { MapPin } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { getContent } from "@/lib/content";
import { SITE } from "@/lib/site";
import { SectionHeading } from "@/components/SectionHeading";
import { ContactButtons } from "@/components/ContactButtons";
import { ContactForm } from "@/components/ContactForm";

export function ContactSection({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  const whatsappBase = `https://wa.me/${SITE.whatsappNumber}`;
  return (
    <section id="contact" className="section-pad bg-cream/50">
      <div className="container-page">
        <SectionHeading title={c.contact.heading} subtitle={c.contact.subheading} />
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ContactForm
              locale={locale}
              labels={c.contact.form}
              whatsappBase={whatsappBase}
            />
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
              <ContactButtons locale={locale} />
              <div className="mt-6 border-t border-line pt-6">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <MapPin className="size-4 text-accent" aria-hidden="true" />
                  {c.contact.areaServedLabel}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {SITE.areaServed[locale].map((area) => (
                    <li
                      key={area}
                      className="rounded-full bg-cream px-3 py-1 text-sm text-muted"
                    >
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
