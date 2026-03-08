"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/series", label: "Series" },
  { href: "/documentaries", label: "Documentaries" },
  { href: "/live-tv", label: "Live TV" },
  { href: "/my-list", label: "My List" },
  { href: "/account", label: "Account" },
];

export function Navbar() {
  const pathname = usePathname();
  const openSearch = useUIStore((s) => s.openSearch);

  // Hide navbar on auth pages
  if (pathname === "/register" || pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <nav className="flex items-center justify-between px-4 md:px-8 h-16">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-accent">L</span>umio
          </Link>

          <ul className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "text-sm transition-colors hover:text-foreground",
                    pathname === link.href
                      ? "text-foreground font-medium"
                      : "text-muted"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={openSearch}
          className="p-2 text-muted hover:text-foreground transition-colors"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>
      </nav>
    </header>
  );
}
