import { create } from "zustand";
import type { PlayerState } from "@/types/player";

interface PlayerStore extends PlayerState {
  setPlaying: (isPlaying: boolean) => void;
  setMuted: (isMuted: boolean) => void;
  setFullscreen: (isFullscreen: boolean) => void;
  setBuffering: (isBuffering: boolean) => void;
  setCurrentTime: (currentTime: number) => void;
  setDuration: (duration: number) => void;
  setBuffered: (buffered: number) => void;
  setVolume: (volume: number) => void;
  setShowControls: (showControls: boolean) => void;
  setShowNextEpisode: (showNextEpisode: boolean) => void;
  setBufferingStartTime: (bufferingStartTime: number | null) => void;
  reset: () => void;
}

const initialState: PlayerState = {
  isPlaying: false,
  isMuted: false,
  isFullscreen: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  volume: 1,
  showControls: true,
  showNextEpisode: false,
  bufferingStartTime: null,
};

export const usePlayerStore = create<PlayerStore>((set) => ({
  ...initialState,
  setPlaying: (isPlaying) => set({ isPlaying }),
  setMuted: (isMuted) => set({ isMuted }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setBuffering: (isBuffering) => set({ isBuffering }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setBuffered: (buffered) => set({ buffered }),
  setVolume: (volume) => set({ volume }),
  setShowControls: (showControls) => set({ showControls }),
  setShowNextEpisode: (showNextEpisode) => set({ showNextEpisode }),
  setBufferingStartTime: (bufferingStartTime) => set({ bufferingStartTime }),
  reset: () => set(initialState),
}));
