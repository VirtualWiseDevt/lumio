"use client";

import { useRef, useCallback } from "react";
import { useHls } from "@/hooks/use-hls";
import { useVideoPlayer } from "@/hooks/use-video-player";
import { usePlayerStore } from "@/stores/player";
import { PlayerControls } from "./PlayerControls";
import { BufferingIndicator } from "./BufferingIndicator";

interface VideoPlayerProps {
  src: string;
  title: string;
  contentId: string;
  episodeId: string | null;
  onClose: () => void;
  onNextEpisode?: () => void;
}

export function VideoPlayer({
  src,
  title,
  contentId,
  episodeId,
  onClose,
  onNextEpisode,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isBuffering = usePlayerStore((s) => s.isBuffering);
  const showControls = usePlayerStore((s) => s.showControls);

  useHls(videoRef, src);
  useVideoPlayer(videoRef);

  const handleTapLeft = useCallback(() => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.max(0, video.currentTime - 10);
  }, []);

  const handleTapCenter = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const handleTapRight = useCallback(() => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.min(video.duration, video.currentTime + 10);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black"
    >
      <video
        ref={videoRef}
        className="h-full w-full"
        playsInline
        autoPlay
      />

      {/* Mobile touch zones - only active when controls are hidden */}
      {!showControls && (
        <div className="absolute inset-0 flex">
          <div
            className="h-full w-1/3"
            onClick={handleTapLeft}
            onDoubleClick={handleTapLeft}
          />
          <div
            className="h-full w-1/3"
            onClick={handleTapCenter}
          />
          <div
            className="h-full w-1/3"
            onClick={handleTapRight}
            onDoubleClick={handleTapRight}
          />
        </div>
      )}

      {isBuffering && <BufferingIndicator />}

      <PlayerControls
        videoRef={videoRef}
        containerRef={containerRef}
        title={title}
        onClose={onClose}
      />
    </div>
  );
}
