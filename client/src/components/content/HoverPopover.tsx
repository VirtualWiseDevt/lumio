"use client";

import Image from "next/image";
import { Play, ThumbsUp, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { cn, mediaUrl, formatDuration } from "@/lib/utils";
import { MyListButton } from "@/components/my-list/MyListButton";
import type { Content } from "@/types/content";

interface HoverPopoverProps {
  content: Content;
  cardRect: DOMRect;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onExpand?: () => void;
}

function getPopoverPosition(cardRect: DOMRect) {
  const popoverWidth = cardRect.width * 1.5;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1400;

  // Center over the card by default
  let left = cardRect.left + cardRect.width / 2 - popoverWidth / 2;

  // Clamp to viewport edges with 8px margin
  if (left < 8) {
    left = 8;
  } else if (left + popoverWidth > viewportWidth - 8) {
    left = viewportWidth - 8 - popoverWidth;
  }

  // Position above or below card based on available space
  const topSpace = cardRect.top;
  const bottomSpace =
    (typeof window !== "undefined" ? window.innerHeight : 800) - cardRect.bottom;
  const estimatedHeight = popoverWidth * 0.75 + 120; // rough height estimate

  let top: number;
  if (bottomSpace >= estimatedHeight || bottomSpace >= topSpace) {
    // Show below or default to below
    top = cardRect.top - 20;
  } else {
    // Show above
    top = cardRect.bottom - estimatedHeight + 20;
  }

  return { left, top, width: popoverWidth };
}

export function HoverPopover({
  content,
  cardRect,
  onMouseEnter,
  onMouseLeave,
  onExpand,
}: HoverPopoverProps) {
  const { left, top, width } = getPopoverPosition(cardRect);
  const backdropSrc = mediaUrl(content.posterLandscape);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed z-50 shadow-2xl"
      style={{ left, top, width }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Backdrop image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-card">
        {backdropSrc ? (
          <Image
            src={backdropSrc}
            alt={content.title}
            fill
            className="object-cover"
            sizes="400px"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-b from-card-hover to-card">
            <span className="text-lg font-semibold text-foreground">
              {content.title}
            </span>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="rounded-b-lg bg-card p-3">
        {/* Action buttons */}
        <div className="mb-2 flex items-center gap-2">
          <button
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              "bg-accent text-white hover:bg-accent-hover transition-colors"
            )}
            aria-label="Play"
          >
            <Play className="h-4 w-4 fill-current" />
          </button>
          <MyListButton contentId={content.id} size="sm" />
          <button
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              "border border-border text-foreground hover:border-foreground transition-colors"
            )}
            aria-label="Like"
          >
            <ThumbsUp className="h-4 w-4" />
          </button>
          <div className="flex-1" />
          <button
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              "border border-border text-foreground hover:border-foreground transition-colors"
            )}
            aria-label="More Info"
            onClick={onExpand}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Metadata row */}
        <div className="mb-1 flex items-center gap-2 text-xs">
          {content.ageRating && (
            <span className="rounded border border-border px-1.5 py-0.5 text-muted">
              {content.ageRating}
            </span>
          )}
          {content.quality && (
            <span className="rounded border border-border px-1.5 py-0.5 text-muted">
              {content.quality}
            </span>
          )}
          {content.duration !== null && content.duration > 0 && (
            <span className="text-muted">{formatDuration(content.duration)}</span>
          )}
          {content.releaseYear && (
            <span className="text-muted">{content.releaseYear}</span>
          )}
        </div>

        {/* Categories */}
        {content.categories.length > 0 && (
          <p className="text-xs text-muted">
            {content.categories.slice(0, 3).join(" \u2022 ")}
          </p>
        )}
      </div>
    </motion.div>
  );
}
