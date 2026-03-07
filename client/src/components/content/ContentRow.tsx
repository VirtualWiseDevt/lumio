"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useContentRow } from "@/hooks/use-content-row";
import { useHoverPopover } from "@/hooks/use-hover-popover";
import { ContentCard } from "./ContentCard";
import { HoverPopover } from "./HoverPopover";
import type { Content } from "@/types/content";

interface ContentRowProps {
  title: string;
  items: Content[];
  onCardClick?: (content: Content) => void;
}

export function ContentRow({ title, items, onCardClick }: ContentRowProps) {
  const { scrollRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight } =
    useContentRow();
  const {
    activeId,
    cardRect,
    onCardMouseEnter,
    onCardMouseLeave,
    onPopoverMouseEnter,
    onPopoverMouseLeave,
  } = useHoverPopover();

  if (items.length === 0) return null;

  const activeContent = activeId
    ? items.find((item) => item.id === activeId) ?? null
    : null;

  return (
    <section className="group/row relative mb-8">
      <h2 className="mb-2 pl-[4%] text-lg font-semibold text-foreground">
        {title}
      </h2>

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
            <div
              key={item.id}
              className="content-card flex-shrink-0"
              style={{ scrollSnapAlign: "start" }}
            >
              <ContentCard
                content={item}
                onMouseEnter={onCardMouseEnter}
                onMouseLeave={onCardMouseLeave}
                onClick={() => onCardClick?.(item)}
              />
            </div>
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

      {/* Hover popover */}
      <AnimatePresence>
        {activeContent && cardRect && (
          <HoverPopover
            key={activeContent.id}
            content={activeContent}
            cardRect={cardRect}
            onMouseEnter={onPopoverMouseEnter}
            onMouseLeave={onPopoverMouseLeave}
            onExpand={() => onCardClick?.(activeContent)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
