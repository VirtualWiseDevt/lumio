"use client";

import { useEffect, useRef, useCallback } from "react";
import type { RefObject } from "react";
import { usePlayerStore } from "@/stores/player";

export function usePlayerControls(
  videoRef: RefObject<HTMLVideoElement | null>,
  containerRef: RefObject<HTMLDivElement | null>,
  onClose: () => void
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setShowControls = usePlayerStore((s) => s.setShowControls);

  const showAndResetTimer = useCallback(() => {
    setShowControls(true);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const video = document.querySelector("video");
      if (video && !video.paused) {
        setShowControls(false);
      }
    }, 3000);
  }, [setShowControls]);

  // Auto-hide on mouse/touch/key activity
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onActivity = () => showAndResetTimer();

    container.addEventListener("mousemove", onActivity);
    container.addEventListener("touchstart", onActivity);
    document.addEventListener("keydown", onActivity);

    // Initial timer
    showAndResetTimer();

    return () => {
      container.removeEventListener("mousemove", onActivity);
      container.removeEventListener("touchstart", onActivity);
      document.removeEventListener("keydown", onActivity);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [containerRef, showAndResetTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const video = videoRef.current;

      switch (e.key) {
        case " ": {
          e.preventDefault();
          if (video) {
            if (video.paused) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          if (video) video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          if (video) video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        }
        case "f":
        case "F": {
          e.preventDefault();
          const container = containerRef.current;
          if (container) {
            import("screenfull").then(({ default: screenfull }) => {
              if (screenfull.isEnabled) {
                screenfull.toggle(container);
              }
            });
          }
          break;
        }
        case "m":
        case "M": {
          e.preventDefault();
          if (video) {
            video.muted = !video.muted;
            usePlayerStore.getState().setMuted(video.muted);
          }
          break;
        }
        case "Escape": {
          onClose();
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [videoRef, containerRef, onClose]);

  // Track fullscreen changes
  useEffect(() => {
    import("screenfull").then(({ default: screenfull }) => {
      if (!screenfull.isEnabled) return;

      const onChange = () => {
        usePlayerStore.getState().setFullscreen(screenfull.isFullscreen);
      };

      screenfull.on("change", onChange);
      return () => screenfull.off("change", onChange);
    });
  }, []);

  return {
    showControls: usePlayerStore((s) => s.showControls),
  };
}
