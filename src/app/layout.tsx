import type { Metadata } from "next";
import { Fira_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

/*
 * Two roles. Instrument Sans stands in for Krea's Suisse Intl, which is
 * licensed — same tall x-height and flat terminals, and it holds up at the
 * small medium-weight sizes this interface leans on. Fira Mono is what Krea
 * actually uses, and it is reserved for numbers and indices.
 */

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const firaMono = Fira_Mono({
  variable: "--font-fira-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Lead Qualifier — Butler Connect AI",
  description: "Score an inquiry against the ideal-customer profile before replying to it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${firaMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
