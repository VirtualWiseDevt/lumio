import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, DM_Serif_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumio - Stream Movies, Series & Live TV",
  description: "Premium video streaming platform for East Africa",
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${playfair.variable} ${dmSans.variable} ${dmSerif.variable}`}>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <Providers>
          <Navbar />
          <main>{children}</main>
          {modal}
          <SearchOverlay />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
