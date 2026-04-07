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
    <section className="group/row relative mb-12">
      {/* Row header */}
      <div className="mb-2 flex items-center justify-between" style={{ padding: "0 56px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#e5e5e5" }}>
          {title}
        </h2>
        <span className="text-sm text-gold opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer hover:underline">
          Explore All
        </span>
      </div>

      {/* Wrapper — holds padding, arrows sit here */}
      <div className="relative" style={{ padding: "0 56px" }}>
        {/* Left arrow */}
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
