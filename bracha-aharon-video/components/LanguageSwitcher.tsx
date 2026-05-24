import Link from "next/link";
import { Languages } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { getContent } from "@/lib/content";

// Switching locale crosses root layouts, so this triggers a full reload by design.
export function LanguageSwitcher({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const other: Locale = locale === "he" ? "en" : "he";
  const label = getContent(locale).footer.switchLanguage;
  return (
    <Link
      href={localePath(other)}
      hrefLang={other}
      className={`inline-flex items-center gap-1.5 text-sm font-medium ${className ?? ""}`}
    >
      <Languages className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
