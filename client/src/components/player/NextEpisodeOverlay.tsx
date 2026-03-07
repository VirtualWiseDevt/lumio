"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Play, X } from "lucide-react";
import { mediaUrl } from "@/lib/utils";

export interface NextEpisodeInfo {
  title: string;
  thumbnail: string | null;
  seasonNumber: number;
  episodeNumber: number;
}

interface NextEpisodeOverlayProps {
  nextEpisode: NextEpisodeInfo;
  onPlay: () => void;
  onCancel: () => void;
}

export function NextEpisodeOverlay({
  nextEpisode,
  onPlay,
  onCancel,
}: NextEpisodeOverlayProps) {
  const [countdown, setCountdown] = useState(10);
  const isAdvancing = useRef(false);

  const handlePlay = useCallback(() => {
    if (isAdvancing.current) return;
    isAdvancing.current = true;
    onPlay();
  }, [onPlay]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-advance when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      handlePlay();
    }
  }, [countdown, handlePlay]);

  const thumbnailSrc = nextEpisode.thumbnail
    ? mediaUrl(nextEpisode.thumbnail)
    : null;

  return (
    <div className="absolute right-6 bottom-24 z-40 w-80 overflow-hidden rounded-lg bg-black/90 shadow-2xl backdrop-blur-sm">
      <div className="p-4">
        <p className="mb-3 text-sm font-medium text-white/70">Next Episode</p>

        <div className="mb-3 flex gap-3">
          {/* Thumbnail */}
          <div className="h-16 w-28 flex-shrink-0 overflow-hidden rounded bg-white/10">
            {thumbnailSrc ? (
              <img
                src={thumbnailSrc}
                alt={nextEpisode.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Play className="h-6 w-6 text-white/40" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/50">
              S{nextEpisode.seasonNumber}:E{nextEpisode.episodeNumber}
            </p>
            <p className="truncate text-sm font-medium text-white">
              {nextEpisode.title}
            </p>
          </div>
        </div>

        {/* Countdown text */}
        <p className="mb-3 text-center text-sm text-white/60">
          Playing in {countdown}...
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handlePlay}
            className="flex flex-1 items-center justify-center gap-2 rounded bg-white py-2 text-sm font-semibold text-black transition-colors hover:bg-white/90"
          >
            <Play className="h-4 w-4" />
            Play Now
          </button>
          <button
            onClick={onCancel}
            className="flex items-center justify-center rounded border border-white/20 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
