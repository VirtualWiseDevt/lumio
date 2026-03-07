"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { RefObject } from "react";
import { usePlayerStore } from "@/stores/player";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface ProgressBarProps {
  videoRef: RefObject<HTMLVideoElement | null>;
}

export function ProgressBar({ videoRef }: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);

  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const buffered = usePlayerStore((s) => s.buffered);

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = buffered * 100;

  const seekToPosition = useCallback(
    (clientX: number) => {
      const bar = barRef.current;
      const video = videoRef.current;
      if (!bar || !video || !duration) return;

      const rect = bar.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      video.currentTime = fraction * duration;
    },
    [videoRef, duration]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      seekToPosition(e.clientX);
    },
    [seekToPosition]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const bar = barRef.current;
      if (!bar || !duration) return;

      const rect = bar.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setHoverTime(fraction * duration);
      setHoverX(e.clientX - rect.left);
    },
    [duration]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null);
  }, []);

  // Global mouse events for drag
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      seekToPosition(e.clientX);
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, seekToPosition]);

  return (
    <div className="group/progress w-full px-2">
      <div
        ref={barRef}
        className="relative h-1 w-full cursor-pointer transition-[height] duration-150 group-hover/progress:h-2"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background (remaining) */}
        <div className="absolute inset-0 rounded-full bg-white/20" />

        {/* Buffered */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/40"
          style={{ width: `${bufferedPercent}%` }}
        />

        {/* Played (red) */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-red-600"
          style={{ width: `${playedPercent}%` }}
        />

        {/* Scrubber dot */}
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 opacity-0 transition-opacity group-hover/progress:opacity-100"
          style={{ left: `${playedPercent}%` }}
        />

        {/* Time tooltip on hover */}
        {hoverTime !== null && (
          <div
            className="absolute -top-8 -translate-x-1/2 rounded bg-black/80 px-2 py-1 text-xs text-white"
            style={{ left: `${hoverX}px` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>

      {/* Time display */}
      <div className="mt-1 flex justify-between text-xs text-white/70">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
