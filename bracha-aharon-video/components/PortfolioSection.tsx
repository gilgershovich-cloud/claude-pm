import type { Locale } from "@/lib/i18n";
import { getContent } from "@/lib/content";
import { SectionHeading } from "@/components/SectionHeading";
import { PortfolioGallery } from "@/components/PortfolioGallery";

export function PortfolioSection({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  return (
    <section id="portfolio" className="section-pad bg-cream/50">
      <div className="container-page">
        <SectionHeading title={c.portfolio.heading} subtitle={c.portfolio.subheading} />
        <PortfolioGallery
          locale={locale}
          allLabel={c.portfolio.all}
          watchLabel={c.portfolio.watch}
          comingSoonLabel={c.portfolio.comingSoon}
        />
      </div>
    </section>
  );
}
