import type { Metadata, Viewport } from "next";
import "../globals.css";
import { rubik } from "@/lib/fonts";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("he");

export const viewport: Viewport = {
  themeColor: "#0c0c11",
};

export default function HeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={rubik.variable}>
      <body>{children}</body>
    </html>
  );
}
