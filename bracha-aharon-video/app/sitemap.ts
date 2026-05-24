import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { localePath } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const heUrl = new URL(localePath("he"), SITE.baseUrl).toString();
  const enUrl = new URL(localePath("en"), SITE.baseUrl).toString();
  const languages = { he: heUrl, en: enUrl, "x-default": heUrl };
  const lastModified = new Date();

  return [
    {
      url: heUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
      alternates: { languages },
    },
    {
      url: enUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages },
    },
  ];
}
