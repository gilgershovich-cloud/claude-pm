import type { Metadata, Viewport } from "next";
import "../../globals.css";
import { rubik } from "@/lib/fonts";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("en");

export const viewport: Viewport = {
  themeColor: "#0c0c11",
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={rubik.variable}>
      <body>{children}</body>
    </html>
  );
}
