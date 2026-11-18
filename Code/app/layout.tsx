import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif, Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { I18nProvider } from "@/components/i18n";
import { RevealObserver } from "@/components/ui";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  title: "Diego Silveira — Creative Developer",
  description:
    "Brazil-based creative developer combining front-end engineering, graphic design, video and growth marketing. Ten years of accessible, conversion-minded digital work.",
};

export const viewport: Viewport = {
  themeColor: "#fbf6ec",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        {/* Enables reveal animations only when JavaScript runs, so content is never hidden without it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="font-sans antialiased">
        <I18nProvider>{children}</I18nProvider>
        <RevealObserver />
      </body>
    </html>
  );
}
