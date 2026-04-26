"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Play, Info, Volume2, VolumeOff } from "lucide-react";
import { cn, mediaUrl } from "@/lib/utils";
import { useIntersection } from "@/hooks/use-intersection";
import { HeroSlide } from "./HeroSlide";
import { HeroControls } from "./HeroControls";
import type { Content } from "@/types/content";

interface HeroBannerProps {
  items: Content[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function HeroBanner({ items }: HeroBannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { ref, isVisible } = useIntersection<HTMLDivElement>({ threshold: 0.3 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const popoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tabVisible, setTabVisible] = useState(true);
  const [popoverActive, setPopoverActive] = useState(false);

  // Filter to playable items, then shuffle once per mount.
  // useMemo with a stable dep ensures it doesn't reshuffle on every render.
  const playable = useMemo(
    () => shuffle(items.filter((i) => i.trailerUrl || i.previewUrl)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.length]
  );

  const safeIndex = playable.length > 0 ? currentIndex % playable.length : 0;
  const current = playable[safeIndex];
  const src = current?.trailerUrl || current?.previewUrl || null;
  const modalOpen = pathname.includes("/title/") || pathname.includes("/watch/");

  useEffect(() => {
    const handler = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const active = (e as CustomEvent).detail;
      if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
      if (active) {
        setPopoverActive(true);
      } else {
        popoverTimerRef.current = setTimeout(() => setPopoverActive(false), 500);
      }
    };
    window.addEventListener("popover-active", handler);
    return () => {
      window.removeEventListener("popover-active", handler);
      if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const shouldPlay = isVisible && !popoverActive && tabVisible && !modalOpen;
    if (shouldPlay) {
      v.muted = isMuted;
      v.play().catch(() => {});
    } else {
      v.pause();
      v.muted = true;
    }
  }, [isVisible, popoverActive, tabVisible, modalOpen, isMuted, currentIndex]);

  const advance = useCallback(() => {
    if (playable.length === 0) return;
    setCurrentIndex((i) => (i + 1) % playable.length);
  }, [playable.length]);

  if (playable.length === 0 || !current) return null;

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ height: "100vh", minHeight: 600 }}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={safeIndex}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          <HeroSlide content={current} isActive isMuted={isMuted} isHeroVisible={isVisible} />
        </motion.div>
      </AnimatePresence>

      {src && (
        <video
          key={src}
          ref={videoRef}
          src={mediaUrl(src)}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 z-[1] h-full w-full object-cover"
          onEnded={advance}
        />
      )}

      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0.2) 50%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2]"
        style={{
          height: "50%",
          background: "linear-gradient(transparent, rgba(0,0,0,0.7) 60%, #141414)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[2]"
        style={{
          height: "30%",
          background: "linear-gradient(rgba(0,0,0,0.4), transparent)",
        }}
      />

      <div className="absolute z-[3]" style={{ left: 56, bottom: "22%" }}>
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
            {current.title}
          </h1>
          {current.description && (
            <p
              className="mb-6 line-clamp-3 max-w-lg"
              style={{ fontSize: 16, color: "#ddd", lineHeight: 1.5 }}
            >
              {current.description}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/watch/${current.id}`)}
              className="flex items-center gap-2 bg-white text-black font-bold transition-colors hover:bg-white/80"
              style={{ padding: "10px 28px", borderRadius: 4 }}
            >
              <Play className="h-5 w-5 fill-current" />
              Play
            </button>
            <button
              onClick={() => router.push(`/title/${current.id}`)}
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

      <div
        className="absolute z-[3] flex items-center gap-3"
        style={{ bottom: "26%", right: 56 }}
      >
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
        >
          {isMuted ? <VolumeOff className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        {current.ageRating && (
          <span
            className="text-sm text-white/80"
            style={{ borderLeft: "2px solid rgba(255,255,255,0.4)", paddingLeft: 8 }}
          >
            {current.ageRating}
          </span>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 z-[3] -translate-x-1/2">
        <HeroControls
          count={playable.length}
          activeIndex={safeIndex}
          onSelect={setCurrentIndex}
        />
      </div>
    </section>
  );
}