"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const footerLinks = {
  Company: [
    { label: "About Us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Contact Us", href: "#" },
    { label: "FAQ", href: "#" },
  ],
  Legal: [
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

export function Footer() {
  const pathname = usePathname();

  // Hide footer on auth and watch pages
  if (pathname === "/register" || pathname === "/login" || pathname.startsWith("/watch")) {
    return null;
  }

  return (
    <footer className="border-t border-[#333]" style={{ padding: "48px 56px" }}>
      <div className="flex flex-col md:flex-row gap-12">
        {/* Logo & description */}
        <div className="md:w-1/3">
          <Link href="/" className="font-display text-xl font-black tracking-[3px]">
            <span className="text-white">L</span>
            <span className="text-gold">&#x25C8;</span>
            <span className="text-white">MIO</span>
          </Link>
          <p className="mt-3 text-sm text-silver leading-relaxed">
            Premium video streaming platform for East Africa. Stream unlimited
            movies, series, documentaries and live TV.
          </p>
        </div>

        {/* Link columns */}
        <div className="flex flex-1 gap-12 md:justify-end">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-3 text-sm font-semibold text-white">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-silver hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="mt-10 text-xs text-[#333]">
        &copy; {new Date().getFullYear()} Lumio. All rights reserved.
      </div>
    </footer>
  );
}
