"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseHeroBannerOptions {
  itemCount: number;
  interval?: number;
}

interface UseHeroBannerReturn {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
}

export function useHeroBanner({
  itemCount,
  interval = 8000,
}: UseHeroBannerOptions): UseHeroBannerReturn {
  const [currentIndex, setCurrentIndexState] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (itemCount <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentIndexState((prev) => (prev + 1) % itemCount);
    }, interval);
  }, [clearTimer, itemCount, interval]);

  // Start/stop timer based on pause state
  useEffect(() => {
    if (isPaused || itemCount <= 1) {
      clearTimer();
    } else {
      startTimer();
    }
    return clearTimer;
  }, [isPaused, startTimer, clearTimer, itemCount]);

  // Reset index if itemCount changes and current is out of bounds
  useEffect(() => {
    if (currentIndex >= itemCount && itemCount > 0) {
      setCurrentIndexState(0);
    }
  }, [itemCount, currentIndex]);

  const setCurrentIndex = useCallback(
    (index: number) => {
      setCurrentIndexState(index);
      // Reset timer when user manually selects a slide
      if (!isPaused) {
        startTimer();
      }
    },
    [isPaused, startTimer]
  );

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  return {
    currentIndex,
    setCurrentIndex,
    isPaused,
    pause,
    resume,
  };
}
