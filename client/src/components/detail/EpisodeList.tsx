"use client";

import { useState } from "react";
import Image from "next/image";
import { cn, formatDuration, mediaUrl } from "@/lib/utils";
import type { Season } from "@/types/content";

interface EpisodeListProps {
  seasons: Season[];
}

export function EpisodeList({ seasons }: EpisodeListProps) {
  const [selectedSeason, setSelectedSeason] = useState(0);

  if (seasons.length === 0) return null;

  const currentSeason = seasons[selectedSeason];
  if (!currentSeason) return null;

  return (
    <div className="px-8 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground">Episodes</h3>
        {seasons.length > 1 && (
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground outline-none focus:border-muted"
          >
            {seasons.map((season, index) => (
              <option key={season.id} value={index}>
                Season {season.number}
                {season.title ? `: ${season.title}` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-0">
        {currentSeason.episodes.map((episode, index) => (
          <div key={episode.id}>
            {index > 0 && <div className="border-t border-border" />}
            <div
              className={cn(
                "flex gap-4 rounded-md py-4 transition-colors",
                "hover:bg-card-hover"
              )}
            >
              {/* Episode number */}
              <div className="flex w-8 shrink-0 items-center justify-center text-lg text-muted">
                {episode.number}
              </div>

              {/* Thumbnail */}
              <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded bg-card">
                {episode.thumbnail ? (
                  <Image
                    src={mediaUrl(episode.thumbnail)}
                    alt={episode.title}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-card-hover">
                    <span className="text-xs text-muted">No preview</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="truncate font-medium text-foreground">
                    {episode.title}
                  </h4>
                  {episode.duration && (
                    <span className="shrink-0 text-sm text-muted">
                      {formatDuration(episode.duration)}
                    </span>
                  )}
                </div>
                {episode.description && (
                  <p className="line-clamp-2 text-sm text-muted">
                    {episode.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
