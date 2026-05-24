import { Rubik } from "next/font/google";

// Rubik supports both Hebrew and Latin, so a single family serves both locales.
export const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-rubik",
  fallback: ["system-ui", "Arial", "sans-serif"],
});
