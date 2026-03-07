"use client";

import { useCallback } from "react";
import type { RefObject } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { usePlayerStore } from "@/stores/player";

interface VolumeControlProps {
  videoRef: RefObject<HTMLVideoElement | null>;
}

export function VolumeControl({ videoRef }: VolumeControlProps) {
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    usePlayerStore.getState().setMuted(video.muted);
  }, [videoRef]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const newVolume = parseFloat(e.target.value);
      video.volume = newVolume;
      video.muted = newVolume === 0;
      usePlayerStore.getState().setVolume(newVolume);
      usePlayerStore.getState().setMuted(newVolume === 0);
    },
    [videoRef]
  );

  return (
    <div className="group/volume flex items-center gap-1">
      <button
        onClick={toggleMute}
        className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </button>

      <div className="w-0 overflow-hidden transition-[width] duration-200 group-hover/volume:w-20">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/30 accent-white"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
