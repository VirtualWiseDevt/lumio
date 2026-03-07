"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import { usePlayerStore } from "@/stores/player";

export function useVideoPlayer(videoRef: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const store = usePlayerStore.getState;
    const set = usePlayerStore.setState;

    const onPlay = () => set({ isPlaying: true });
    const onPause = () => set({ isPlaying: false });
    const onTimeUpdate = () => set({ currentTime: video.currentTime });
    const onDurationChange = () => {
      if (Number.isFinite(video.duration)) {
        set({ duration: video.duration });
      }
    };
    const onWaiting = () =>
      set({ isBuffering: true, bufferingStartTime: Date.now() });
    const onPlaying = () =>
      set({ isBuffering: false, bufferingStartTime: null });
    const onProgress = () => {
      if (video.buffered.length > 0 && video.duration > 0) {
        const end = video.buffered.end(video.buffered.length - 1);
        set({ buffered: end / video.duration });
      }
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("progress", onProgress);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("progress", onProgress);

      usePlayerStore.getState().reset();
    };
  }, [videoRef]);
}
