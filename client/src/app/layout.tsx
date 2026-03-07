import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/Navbar";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import "./globals.css";

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
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <Providers>
          <Navbar />
          <main>{children}</main>
          {modal}
          <SearchOverlay />
        </Providers>
      </body>
    </html>
  );
}
