import type { Locale } from "@/lib/i18n";
import {
  localBusinessJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  videoJsonLd,
  jsonLdScript,
} from "@/lib/seo";

// Server-rendered structured data for SEO. Renders one <script> per block.
export function JsonLd({ locale }: { locale: Locale }) {
  const blocks = [
    localBusinessJsonLd(locale),
    breadcrumbJsonLd(locale),
    faqJsonLd(locale),
    ...videoJsonLd(locale),
  ];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(block) }}
        />
      ))}
    </>
  );
}
