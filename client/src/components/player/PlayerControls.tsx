"use client";

import type { RefObject } from "react";

interface PlayerControlsProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  title: string;
  onClose: () => void;
}

export function PlayerControls({
  videoRef,
  containerRef,
  title,
  onClose,
}: PlayerControlsProps) {
  // Placeholder - will be implemented in Task 2
  return null;
}
