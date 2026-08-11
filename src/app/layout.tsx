import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/*
 * Three roles, and the split is the whole point.
 *
 * Inter is the interface: buttons, labels, form fields, table rows. It is
 * deliberately characterless — that is what it is for, and at 13–14px any face
 * with opinions becomes noise.
 *
 * Bricolage Grotesque is the voice, and it is rationed. It appears on the page
 * title, the verdict headline, the score and the closing action, and nowhere
 * else. Its width and optical-size axes mean it tightens as it grows, so it has
 * real presence at 48px+ without needing to be shouted. Set it small and the
 * personality turns into fussiness — if it starts creeping into labels, that's
 * the mistake.
 *
 * JetBrains Mono is for numbers, timestamps and indices, where a fixed advance
 * width is what makes a column scannable.
 */

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
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
      className={`${inter.variable} ${bricolage.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
