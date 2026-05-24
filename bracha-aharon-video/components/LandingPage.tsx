import type { Locale } from "@/lib/i18n";
import { getContent } from "@/lib/content";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { ServicesGrid } from "@/components/ServicesGrid";
import { PortfolioSection } from "@/components/PortfolioSection";
import { About } from "@/components/About";
import { Testimonials } from "@/components/Testimonials";
import { ProcessSteps } from "@/components/ProcessSteps";
import { Packages } from "@/components/Packages";
import { Faq } from "@/components/Faq";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";

export function LandingPage({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  return (
    <>
      <JsonLd locale={locale} />
      <Header locale={locale} />
      <main>
        <Hero locale={locale} />
        <StatsBar locale={locale} />
        <ServicesGrid locale={locale} />
        <PortfolioSection locale={locale} />
        <About locale={locale} />
        <Testimonials locale={locale} />
        <ProcessSteps locale={locale} />
        <Packages locale={locale} />
        <Faq heading={c.faq.heading} items={c.faq.items} />
        <ContactSection locale={locale} />
      </main>
      <Footer locale={locale} />
    </>
  );
}
