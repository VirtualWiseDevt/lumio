"use client";

import Image from "next/image";
import { mediaUrl } from "@/lib/utils";
import type { Content } from "@/types/content";

interface HeroSlideProps {
  content: Content;
  isActive: boolean;
  isMuted: boolean;
  isHeroVisible: boolean;
}

export function HeroSlide({ content, isActive }: HeroSlideProps) {
  const posterSrc = content.posterLandscape
    ? mediaUrl(content.posterLandscape)
    : content.posterPortrait
    ? mediaUrl(content.posterPortrait)
    : null;

  return (
    <div className="absolute inset-0">
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />
      )}
    </div>
  );
}