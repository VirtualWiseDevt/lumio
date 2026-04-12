"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Play, Info, Volume2, VolumeOff } from "lucide-react";
import { cn, mediaUrl } from "@/lib/utils";
import { useHeroBanner } from "@/hooks/use-hero-banner";
import { useIntersection } from "@/hooks/use-intersection";
import { HeroSlide } from "./HeroSlide";
import { HeroControls } from "./HeroControls";
import type { Content } from "@/types/content";

interface HeroBannerProps {
  items: Content[];
}

export function HeroBanner({ items }: HeroBannerProps) {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);
  const { ref, isVisible } = useIntersection<HTMLDivElement>({ threshold: 0.3 });

  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLVideoElement>(null);

  const { currentIndex, setCurrentIndex, pause, resume } = useHeroBanner({
    itemCount: items.length,
    interval: 8000,
  });

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];
  if (!currentItem) return null;

  // Auto-play preview after 2 seconds if available
  useEffect(() => {
    setShowPreview(false);
    if (!currentItem.previewUrl) return;
    const timer = setTimeout(() => setShowPreview(true), 2000);
    return () => clearTimeout(timer);
  }, [currentItem]);

  // Sync mute state with preview video
  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.muted = isMuted;
    }
  }, [isMuted, showPreview]);

  // Pause preview when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      const video = previewRef.current;
      if (!video) return;
      if (document.hidden) {
        video.pause();
      } else if (showPreview) {
        video.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [showPreview]);

  // Pause preview when scrolled out of view
  useEffect(() => {
    const heroEl = ref.current;
    const video = previewRef.current;
    if (!heroEl || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          video.pause();
        } else if (showPreview) {
          video.play().catch(() => {});
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(heroEl);
    return () => observer.disconnect();
  }, [showPreview, ref]);

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ height: "90vh", minHeight: 500 }}
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

      {/* Preview video â€” z-[1] sits above poster slides */}
      {showPreview && currentItem.previewUrl && (
        <video
          ref={previewRef}
          src={mediaUrl(currentItem.previewUrl)}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          className="absolute inset-0 z-[1] h-full w-full object-cover transition-opacity duration-1000"
          onError={() => setShowPreview(false)}
        />
      )}

      {/* Gradient overlays â€” z-[2] sits ON TOP of both poster and video */}
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background: "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0.2) 50%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2]"
        style={{
          height: "50%",
          background: "linear-gradient(transparent, rgba(0,0,0,0.7) 60%, #141414)",
        }}
      />
      {/* Top vignette for subtle darkening */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[2]"
        style={{
          height: "30%",
          background: "linear-gradient(rgba(0,0,0,0.4), transparent)",
        }}
      />

      {/* Content info - bottom left â€” z-[3] above gradients */}
      <div className="absolute z-[3]" style={{ left: 56, bottom: "28%" }}>
        <div className="max-w-2xl">
          <h1
            className="mb-3 font-serif text-white"
            style={{
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1,
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            }}
          >
            {currentItem.title}
          </h1>

          {currentItem.description && (
            <p
              className="mb-6 line-clamp-3 max-w-lg"
              style={{ fontSize: 16, color: "#ddd", lineHeight: 1.5 }}
            >
              {currentItem.description}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/watch/${currentItem.id}`)}
              className="flex items-center gap-2 bg-white text-black font-bold transition-colors hover:bg-white/80"
              style={{ padding: "10px 28px", borderRadius: 4 }}
            >
              <Play className="h-5 w-5 fill-current" />
              Play
            </button>
            <button
              onClick={() => router.push(`/title/${currentItem.id}`)}
              className="flex items-center gap-2 text-white font-semibold transition-colors hover:bg-white/20"
              style={{
                padding: "10px 28px",
                borderRadius: 4,
                background: "rgba(109,109,110,0.7)",
              }}
            >
              <Info className="h-5 w-5" />
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* Bottom right: mute circle then age pill â€” z-[3] above gradients */}
      <div className="absolute z-[3] flex items-center gap-3" style={{ bottom: "32%", right: 56 }}>
        <button
          onClick={() => setIsMuted((m) => !m)}
          className={cn(
            "flex items-center justify-center rounded-full text-white transition-colors",
            "hover:border-white/60 hover:bg-black/60"
          )}
          style={{
            width: 42,
            height: 42,
            border: "1px solid rgba(255,255,255,0.5)",
            background: "rgba(0,0,0,0.4)",
          }}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeOff className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        {currentItem.ageRating && (
          <span
            className="text-sm text-white/80"
            style={{ borderLeft: "2px solid rgba(255,255,255,0.4)", paddingLeft: 8 }}
          >
            {currentItem.ageRating}
          </span>
        )}
      </div>

      {/* Dot indicators - bottom center */}
      <div className="absolute bottom-8 left-1/2 z-[3] -translate-x-1/2">
        <HeroControls
          count={items.length}
          activeIndex={currentIndex}
          onSelect={setCurrentIndex}
        />
      </div>
    </section>
  );
}



