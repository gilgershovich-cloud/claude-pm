import type { Locale } from "@/lib/i18n";
import { getContent } from "@/lib/content";
import { whatsappLink } from "@/lib/site";
import { ShowreelVideo } from "@/components/ShowreelVideo";
import { MessageCircle } from "lucide-react";

export function Hero({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  const waMessage =
    locale === "he"
      ? "היי ברכה, אשמח להצעת מחיר לעריכת וידאו"
      : "Hi Bracha, I'd love a quote for video editing";

  return (
    <section className="relative overflow-hidden bg-night text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(80% 60% at 80% 0%, rgba(199,154,63,.18) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />
      <div className="container-page relative grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <div className="text-center lg:text-start">
          <span className="inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
            {c.hero.eyebrow}
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            {c.hero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/75 lg:mx-0">
            {c.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <a
              href="#contact"
              className="inline-flex items-center rounded-full bg-accent px-7 py-3.5 font-semibold text-white shadow-lg transition hover:bg-accent-strong"
            >
              {c.cta.primary}
            </a>
            <a
              href={whatsappLink(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10"
            >
              <MessageCircle className="size-5" aria-hidden="true" />
              {c.cta.whatsapp}
            </a>
          </div>
        </div>

        <div className="relative">
          <ShowreelVideo label={c.hero.showreelLabel} />
        </div>
      </div>
    </section>
  );
}
