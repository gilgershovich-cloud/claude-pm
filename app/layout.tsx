import type { Metadata } from "next";
import "./globals.css";
import { SidebarServer } from "@/components/SidebarServer";

export const metadata: Metadata = {
  title: "Claude PM",
  description: "Project management dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" style={{ height: '100%' }}>
      <body style={{ height: '100%', display: 'flex', margin: 0 }}>
        <SidebarServer />
        <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
