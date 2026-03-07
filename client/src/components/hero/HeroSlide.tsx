"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { mediaUrl } from "@/lib/utils";
import type { Content } from "@/types/content";

type MediaState = "image" | "buffering" | "video";

interface HeroSlideProps {
  content: Content;
  isActive: boolean;
  isMuted: boolean;
  isHeroVisible: boolean;
}

export function HeroSlide({ content, isActive, isMuted, isHeroVisible }: HeroSlideProps) {
  const [mediaState, setMediaState] = useState<MediaState>("image");
  const videoRef = useRef<HTMLVideoElement>(null);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasTrailer = Boolean(content.trailerUrl);
  const posterSrc = content.posterLandscape ? mediaUrl(content.posterLandscape) : null;

  // Clean up delay timer
  const clearDelayTimer = useCallback(() => {
    if (delayTimerRef.current !== null) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  }, []);

  // Handle video loading with delay
  useEffect(() => {
    if (!isActive || !hasTrailer || !isHeroVisible) {
      // Not active or no trailer or not visible -- show image, pause video
      clearDelayTimer();
      setMediaState("image");

      const video = videoRef.current;
      if (video) {
        video.pause();
      }
      return;
    }

    // Active with trailer and visible -- start delay then buffer video
    delayTimerRef.current = setTimeout(() => {
      setMediaState("buffering");

      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        video.play().catch(() => {
          // Autoplay blocked or failed -- stay on image
          setMediaState("image");
        });
      }
    }, 1500);

    return clearDelayTimer;
  }, [isActive, hasTrailer, isHeroVisible, clearDelayTimer]);

  // Sync mute state
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  const handleCanPlay = useCallback(() => {
    // Only transition to video if still buffering (not reset back to image)
    setMediaState((prev) => (prev === "buffering" ? "video" : prev));
  }, []);

  const handleError = useCallback(() => {
    setMediaState("image");
  }, []);

  return (
    <div className="absolute inset-0">
      {/* Backdrop image */}
      {posterSrc ? (
        <Image
          src={posterSrc}
          alt={content.title}
          fill
          priority={isActive}
          className="object-cover"
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-background to-card" />
      )}

      {/* Video layer */}
      {hasTrailer && (
        <video
          ref={videoRef}
          src={content.trailerUrl!}
          muted={isMuted}
          playsInline
          loop
          preload="none"
          onCanPlay={handleCanPlay}
          onError={handleError}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          style={{ opacity: mediaState === "video" ? 1 : 0 }}
        />
      )}
    </div>
  );
}
