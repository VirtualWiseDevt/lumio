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
    <section className="group/row relative mb-8">
      <div className="mb-2 flex items-center gap-4 pl-[4%]">
        <h2 className="text-lg font-semibold text-foreground">
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

      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className={cn(
              "absolute left-0 top-0 bottom-0 z-10 flex w-10 items-center justify-center",
              "bg-black/50 text-white opacity-0 transition-opacity",
              "group-hover/row:opacity-100 hover:bg-black/70"
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="scrollbar-hide flex flex-nowrap gap-2 overflow-x-auto px-[4%]"
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
              <div className="relative overflow-hidden rounded">
                {/* Poster */}
                <img
                  src={mediaUrl(item.content.posterPortrait)}
                  alt={item.content.title}
                  className="aspect-[2/3] w-full object-cover"
                  loading="lazy"
                />

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div
                    className="h-full bg-red-600"
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Title */}
              <div className="mt-1 px-0.5">
                <p className="truncate text-sm text-white">
                  {item.content.title}
                </p>
                {item.episodeTitle && (
                  <p className="truncate text-xs text-white/50">
                    {item.episodeTitle}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className={cn(
              "absolute right-0 top-0 bottom-0 z-10 flex w-10 items-center justify-center",
              "bg-black/50 text-white opacity-0 transition-opacity",
              "group-hover/row:opacity-100 hover:bg-black/70"
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </section>
  );
}
