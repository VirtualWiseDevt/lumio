"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, Settings, Heart, BookmarkPlus, Clock, Gift, Ticket, CreditCard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/series", label: "Series" },
  { href: "/documentaries", label: "Documentaries" },
  { href: "/live-tv", label: "Live TV" },
  { href: "/my-list", label: "My List" },
];

const dropdownItems = [
  { href: "/account", label: "Settings", icon: Settings },
  { href: "/my-list", label: "Watchlist", icon: BookmarkPlus },
  { href: "/my-list", label: "Favorites", icon: Heart },
  { href: "/", label: "Continue Watching", icon: Clock },
  { href: "/invite", label: "Invite Friends", icon: Gift },
  { href: "/billing", label: "Redeem Coupon", icon: Ticket },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const openSearch = useUIStore((s) => s.openSearch);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide navbar on auth pages
  if (pathname === "/register" || pathname === "/login") return null;

  const handleSignOut = () => {
    setDropdownOpen(false);
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-colors duration-300",
        scrolled
          ? "bg-background"
          : "bg-gradient-to-b from-black/70 via-black/30 to-transparent"
      )}
    >
      <nav className="flex items-center justify-between h-[68px]" style={{ padding: "0 56px" }}>
        <div className="flex items-center gap-10">
          <Link href="/" className="font-display text-[28px] font-black tracking-[3px]">
            <span className="text-white">L</span>
            <span className="text-gold">&#x25C8;</span>
            <span className="text-white">MIO</span>
          </Link>

          <ul className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "text-sm transition-colors hover:text-white",
                    pathname === link.href
                      ? "text-white font-semibold"
                      : "text-[#e5e5e5]"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={openSearch}
            className="p-2 text-[#e5e5e5] hover:text-white transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            className="relative p-2 text-[#e5e5e5] hover:text-white transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red" />
          </button>

          {/* Avatar dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex h-8 w-8 items-center justify-center rounded text-black font-bold text-sm"
              style={{
                background: "linear-gradient(135deg, #E8A020, #FFD700)",
                borderRadius: "4px",
              }}
              aria-label="Account menu"
            >
              U
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-md border border-[#333] bg-[#1a1a1a] py-1 shadow-xl">
                {dropdownItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e5e5e5] hover:bg-white/10 transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-silver" />
                    {item.label}
                  </Link>
                ))}
                <div className="border-t border-[#333] my-1" />
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#e5e5e5] hover:bg-white/10 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-silver" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
