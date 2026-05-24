import type { Locale } from "@/lib/i18n";
import { getContent } from "@/lib/content";

export function StatsBar({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  return (
    <section className="border-b border-line bg-night-2 text-white">
      <div className="container-page grid grid-cols-3 divide-x divide-white/10 py-8 rtl:divide-x-reverse">
        {c.stats.map((s) => (
          <div key={s.label} className="px-2 text-center">
            <div className="text-3xl font-extrabold text-accent sm:text-4xl">
              {s.value}
            </div>
            <div className="mt-1 text-sm text-white/70">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
