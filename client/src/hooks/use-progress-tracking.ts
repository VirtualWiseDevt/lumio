"use client";

import { useEffect, useRef, useCallback, type RefObject } from "react";
import { saveProgress } from "@/api/progress";

interface UseProgressTrackingOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  contentId: string;
  episodeId: string | null;
  onComplete?: () => void;
}

export function useProgressTracking({
  videoRef,
  contentId,
  episodeId,
  onComplete,
}: UseProgressTrackingOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTriggeredComplete = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep callback ref current without re-running effects
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const getProgressData = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration || video.duration === Infinity) return null;
    return {
      contentId,
      episodeId,
      timestamp: Math.floor(video.currentTime),
      duration: Math.floor(video.duration),
    };
  }, [videoRef, contentId, episodeId]);

  const checkCompletion = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration || hasTriggeredComplete.current) return;
    if (video.currentTime / video.duration >= 0.9) {
      hasTriggeredComplete.current = true;
      onCompleteRef.current?.();
    }
  }, [videoRef]);

  const sendBeaconProgress = useCallback(() => {
    const data = getProgressData();
    if (!data || data.timestamp === 0) return;
    const blob = new Blob([JSON.stringify(data)], {
      type: "application/json",
    });
    navigator.sendBeacon("/api/progress", blob);
  }, [getProgressData]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset completion flag when episode changes
    hasTriggeredComplete.current = false;

    // Save progress every 10 seconds
    intervalRef.current = setInterval(() => {
      const data = getProgressData();
      if (data && data.timestamp > 0) {
        saveProgress(data).catch(() => {});
      }
      checkCompletion();
    }, 10_000);

    // Save on pause
    const handlePause = () => {
      const data = getProgressData();
      if (data && data.timestamp > 0) {
        saveProgress(data).catch(() => {});
      }
      checkCompletion();
    };

    // Save on unload via sendBeacon
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendBeaconProgress();
      }
    };

    const handlePageHide = () => {
      sendBeaconProgress();
    };

    video.addEventListener("pause", handlePause);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      video.removeEventListener("pause", handlePause);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [videoRef, contentId, episodeId, getProgressData, checkCompletion, sendBeaconProgress]);
}
