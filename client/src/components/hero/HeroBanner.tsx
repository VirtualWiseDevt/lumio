"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Play, Info, Volume2, VolumeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHeroBanner } from "@/hooks/use-hero-banner";
import { useIntersection } from "@/hooks/use-intersection";
import { HeroSlide } from "./HeroSlide";
import { HeroControls } from "./HeroControls";
import type { Content } from "@/types/content";

interface HeroBannerProps {
  items: Content[];
}

export function HeroBanner({ items }: HeroBannerProps) {
  const [isMuted, setIsMuted] = useState(true);
  const { ref, isVisible } = useIntersection<HTMLDivElement>({ threshold: 0.3 });

  const { currentIndex, setCurrentIndex, pause, resume } = useHeroBanner({
    itemCount: items.length,
    interval: 8000,
  });

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];
  if (!currentItem) return null;

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ height: "70vh", minHeight: 400 }}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {/* Slides */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <HeroSlide
            content={currentItem}
            isActive={true}
            isMuted={isMuted}
            isHeroVisible={isVisible}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

      {/* Content info - bottom left */}
      <div className="absolute bottom-16 left-6 z-10 max-w-xl md:left-12 lg:left-16">
        <h1 className="mb-2 text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">
          {currentItem.title}
        </h1>

        {currentItem.description && (
          <p className="mb-4 line-clamp-2 text-sm text-foreground/80 drop-shadow md:text-base">
            {currentItem.description}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            className={cn(
              "flex items-center gap-2 rounded px-5 py-2 text-sm font-semibold transition-colors",
              "bg-white text-background hover:bg-white/80"
            )}
          >
            <Play className="h-5 w-5 fill-current" />
            Play
          </button>
          <button
            className={cn(
              "flex items-center gap-2 rounded px-5 py-2 text-sm font-semibold transition-colors",
              "bg-white/20 text-white hover:bg-white/30"
            )}
          >
            <Info className="h-5 w-5" />
            More Info
          </button>
        </div>
      </div>

      {/* Dot indicators - bottom center */}
      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
        <HeroControls
          count={items.length}
          activeIndex={currentIndex}
          onSelect={setCurrentIndex}
        />
      </div>

      {/* Mute/unmute button - bottom right */}
      <button
        onClick={() => setIsMuted((m) => !m)}
        className={cn(
          "absolute bottom-6 right-6 z-10 flex h-10 w-10 items-center justify-center",
          "rounded-full border border-white/40 bg-black/40 text-white transition-colors",
          "hover:border-white/60 hover:bg-black/60 md:right-12"
        )}
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeOff className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </section>
  );
}
