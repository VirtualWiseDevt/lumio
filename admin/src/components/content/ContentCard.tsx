import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import type { Content } from "@/api/content";

interface ContentCardProps {
  content: Content;
  onEdit: (content: Content) => void;
  onDelete: (content: Content) => void;
}

export function ContentCard({ content, onEdit, onDelete }: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const posterUrl = content.posterPortrait
    ? `/api/media/${content.posterPortrait}`
    : null;

  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster image */}
      <div className="relative aspect-[2/3] w-full bg-muted">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={content.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4">
            <span className="text-center text-sm font-medium text-muted-foreground">
              {content.title}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center gap-2 bg-black/60 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0",
          )}
        >
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9"
            onClick={() => onEdit(content)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-9 w-9"
            onClick={() => onDelete(content)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Top-right badges */}
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          {content.type === "CHANNEL" ? (
            <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              LIVE
            </span>
          ) : content.quality ? (
            <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              {content.quality}
            </span>
          ) : null}
        </div>
      </div>

      {/* Card footer */}
      <div className="space-y-1 p-3">
        <h3 className="truncate text-sm font-medium">{content.title}</h3>
        <div className="flex items-center justify-between">
          {content.releaseYear && (
            <span className="text-xs text-muted-foreground">
              {content.releaseYear}
            </span>
          )}
          <StatusBadge isPublished={content.isPublished} />
        </div>
      </div>
    </div>
  );
}
