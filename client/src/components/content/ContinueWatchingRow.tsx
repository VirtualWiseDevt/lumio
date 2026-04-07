"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn, mediaUrl } from "@/lib/utils";
import { getContinueWatching } from "@/api/progress";
import { useContentRow } from "@/hooks/use-content-row";
import type { ContinueWatchingItem } from "@/types/player";

const TIME_FILTERS = [
  { label: "3 months", value: 3 },
  { label: "6 months", value: 6 },
  { label: "12 months", value: 12 },
] as const;

export function ContinueWatchingRow() {
  const [months, setMonths] = useState(3);
  const { scrollRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight } =
    useContentRow();

  const { data: items = [] } = useQuery<ContinueWatchingItem[]>({
    queryKey: ["continue-watching", months],
    queryFn: () => getContinueWatching(months),
  });

  if (items.length === 0) return null;

  return (
    <section className="group/row relative mb-12">
      <div className="mb-2 flex items-center gap-4" style={{ padding: "0 56px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#e5e5e5" }}>
          Continue Watching
        </h2>
        <div className="flex gap-1">
          {TIME_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setMonths(filter.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs transition-colors",
                months === filter.value
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Wrapper — holds padding, arrows sit here */}
      <div className="relative" style={{ padding: "0 56px" }}>
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className={cn(
              "absolute top-0 bottom-0 z-10 flex items-center justify-center",
              "text-white opacity-0 transition-opacity",
              "group-hover/row:opacity-100"
            )}
            style={{
              left: 0,
              width: 56,
              background: "linear-gradient(to right, rgba(20,20,20,0.8), transparent)",
            }}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}

        {/* Scroll container — NO padding */}
        <div
          ref={scrollRef}
          className="scrollbar-hide flex flex-nowrap gap-[5px] overflow-x-auto"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {items.map((item) => (
            <Link
              key={item.id}
              href={
                item.episodeId
                  ? `/watch/${item.content.id}?episode=${item.episodeId}`
                  : `/watch/${item.content.id}`
              }
              className="content-card flex-shrink-0"
              style={{ scrollSnapAlign: "start" }}
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: "16/9", borderRadius: 4, background: "#222" }}>
                <img
                  src={mediaUrl(item.content.posterLandscape || item.content.posterPortrait)}
                  alt={item.content.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Title overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 pb-2.5 pt-8">
                  <p className="truncate text-[13px] font-bold text-white">
                    {item.content.title}
                  </p>
                  {item.episodeTitle && (
                    <p className="truncate text-[11px] text-white/50">
                      {item.episodeTitle}
                    </p>
                  )}
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
                  <div
                    className="h-full bg-red"
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {canScrollRight && (
          <button
            onClick={scrollRight}
            className={cn(
              "absolute top-0 bottom-0 z-10 flex items-center justify-center",
              "text-white opacity-0 transition-opacity",
              "group-hover/row:opacity-100"
            )}
            style={{
              right: 0,
              width: 56,
              background: "linear-gradient(to left, rgba(20,20,20,0.8), transparent)",
            }}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        )}
      </div>
    </section>
  );
}
