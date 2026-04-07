"use client";

import { useCallback } from "react";
import type { RefObject } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize,
  Minimize,
  X,
} from "lucide-react";
import { usePlayerStore } from "@/stores/player";
import { usePlayerControls } from "@/hooks/use-player-controls";
import { MyListButton } from "@/components/my-list/MyListButton";
import { ProgressBar } from "./ProgressBar";
import { VolumeControl } from "./VolumeControl";

interface PlayerControlsProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  title: string;
  contentId: string;
  onClose: () => void;
}

export function PlayerControls({
  videoRef,
  containerRef,
  title,
  contentId,
  onClose,
}: PlayerControlsProps) {
  const { showControls } = usePlayerControls(videoRef, containerRef, onClose);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isFullscreen = usePlayerStore((s) => s.isFullscreen);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [videoRef]);

  const skipBack = useCallback(() => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.max(0, video.currentTime - 10);
  }, [videoRef]);

  const skipForward = useCallback(() => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.min(video.duration, video.currentTime + 10);
  }, [videoRef]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    import("screenfull").then(({ default: screenfull }) => {
      if (screenfull.isEnabled) {
        screenfull.toggle(container);
      }
    });
  }, [containerRef]);

  return (
    <div
      className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${
        showControls ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{ cursor: showControls ? "auto" : "none" }}
    >
      {/* Top gradient bar */}
      <div className="bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white drop-shadow-md">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <MyListButton contentId={contentId} size="sm" />
            <button
              onClick={onClose}
              className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
              aria-label="Close player"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Spacer — click to toggle play */}
      <div className="flex-1" onClick={togglePlay} />

      {/* Bottom gradient bar */}
      <div className="bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-8" onClick={(e) => e.stopPropagation()}>
        <ProgressBar videoRef={videoRef} />

        {/* Control buttons row */}
        <div className="mt-2 flex items-center gap-1">
          <button
            onClick={togglePlay}
            className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </button>

          <button
            onClick={skipBack}
            className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
            aria-label="Skip back 10 seconds"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          <button
            onClick={skipForward}
            className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
            aria-label="Skip forward 10 seconds"
          >
            <SkipForward className="h-5 w-5" />
          </button>

          <VolumeControl videoRef={videoRef} />

          {/* Spacer */}
          <div className="flex-1" />

          <button
            onClick={toggleFullscreen}
            className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
