"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { X, Search } from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { useSearch } from "@/hooks/use-search";
import { searchContent } from "@/api/content";
import { SearchResults } from "./SearchResults";
import type { Content } from "@/types/content";

export function SearchOverlay() {
  const router = useRouter();
  const isSearchOpen = useUIStore((s) => s.isSearchOpen);
  const closeSearch = useUIStore((s) => s.closeSearch);
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, debouncedQuery, clear } = useSearch();

  const { data, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchContent(debouncedQuery),
    enabled: debouncedQuery.length >= 1,
  });

  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  function handleSelect(content: Content) {
    closeSearch();
    clear();
    router.push(`/title/${content.id}`);
  }

  function handleClose() {
    closeSearch();
    clear();
  }

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] overflow-y-auto"
          style={{ background: "rgba(20,20,20,0.97)" }}
        >
          <div className="mx-auto max-w-3xl px-4 pt-8">
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={handleClose}
                className="p-2 text-silver hover:text-white transition-colors"
                aria-label="Close search"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative border-b border-[#333] pb-4">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 text-silver" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) {
                    closeSearch();
                    clear();
                    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                  }
                }}
                placeholder="Search movies, series, channels..."
                className="w-full bg-transparent pl-10 text-2xl text-white placeholder:text-silver/50 outline-none"
              />
            </div>

            <div className="mt-6 pb-8">
              {debouncedQuery.length === 0 && (
                <p className="text-center text-silver py-16">
                  Start typing to search
                </p>
              )}

              {debouncedQuery.length >= 1 && isLoading && (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-24 rounded bg-card animate-pulse" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {[1, 2].map((j) => (
                          <div
                            key={j}
                            className="flex items-center gap-3 p-2"
                          >
                            <div className="h-16 w-11 rounded bg-card animate-pulse" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-32 rounded bg-card animate-pulse" />
                              <div className="h-3 w-20 rounded bg-card animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {debouncedQuery.length >= 1 && !isLoading && data && (
                <SearchResults results={data} onSelect={handleSelect} />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
