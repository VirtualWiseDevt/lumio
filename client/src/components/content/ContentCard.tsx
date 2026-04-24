"use client";
import Image from "next/image";
import { cn, mediaUrl } from "@/lib/utils";
import type { Content } from "@/types/content";

interface ContentCardProps {
  content: Content;
  progressPercent?: number;
  onMouseEnter?: (id: string, el: HTMLElement) => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

export function ContentCard({
  content,
  progressPercent,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: ContentCardProps) {
  const posterSrc = mediaUrl(content.posterPortrait || content.posterLandscape);

  return (
    <div
      className="cursor-pointer group/card"
      onMouseEnter={(e) => onMouseEnter?.(content.id, e.currentTarget)}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-[#222]",
          "transition-all duration-200 group-hover/card:scale-105 group-hover/card:shadow-[0_8px_25px_rgba(0,0,0,0.6)]"
        )}
        style={{ aspectRatio: "2/3", borderRadius: 4 }}
      >
        <Image
          src={posterSrc}
          alt={content.title}
          fill
          className="object-cover"
          sizes="(min-width: 1400px) 14vw, (min-width: 1100px) 16vw, (min-width: 800px) 20vw, (min-width: 500px) 33vw, 50vw"
          unoptimized={posterSrc.endsWith(".svg")}
        />
        {/* Title overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 pb-2.5 pt-10">
          <p className="text-[13px] font-bold text-white truncate">{content.title}</p>
        </div>
        {/* Progress bar for continue watching */}
        {progressPercent != null && progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
            <div
              className="h-full bg-red"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
