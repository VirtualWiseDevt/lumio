"use client";

import Image from "next/image";
import { cn, mediaUrl } from "@/lib/utils";
import type { Content } from "@/types/content";

interface ContentCardProps {
  content: Content;
  onMouseEnter?: (id: string, el: HTMLElement) => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

export function ContentCard({
  content,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: ContentCardProps) {
  const posterSrc = mediaUrl(content.posterPortrait);

  return (
    <div
      className="cursor-pointer"
      onMouseEnter={(e) => onMouseEnter?.(content.id, e.currentTarget)}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div
        className={cn(
          "relative aspect-[2/3] overflow-hidden rounded-md bg-card",
          "transition-transform duration-200 hover:scale-105"
        )}
      >
        {posterSrc ? (
          <Image
            src={posterSrc}
            alt={content.title}
            fill
            className="object-cover"
            sizes="(min-width: 1400px) 16vw, (min-width: 1100px) 20vw, (min-width: 800px) 25vw, (min-width: 500px) 33vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-b from-card-hover to-card p-2">
            <span className="text-center text-sm text-muted">{content.title}</span>
          </div>
        )}
      </div>
      <p className="mt-1 truncate text-sm text-foreground">{content.title}</p>
    </div>
  );
}
