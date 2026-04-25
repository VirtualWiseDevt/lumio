"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Play, ThumbsUp, ChevronDown, Volume2, VolumeOff } from "lucide-react";
import { motion } from "motion/react";
import { cn, mediaUrl, formatDuration } from "@/lib/utils";
import { MyListButton } from "@/components/my-list/MyListButton";
import { SubscribeGate } from "@/components/billing/SubscribeGate";
import { useSubscription } from "@/hooks/use-subscription";
import { YouTubeEmbed } from "@/components/content/YouTubeEmbed";
import type { Content } from "@/types/content";

interface HoverPopoverProps {
  content: Content;
  cardRect: DOMRect;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onExpand?: () => void;
}

function getPopoverPosition(cardRect: DOMRect) {
  const popoverWidth = 320;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1400;
  let left = cardRect.left + cardRect.width / 2 - popoverWidth / 2;
  if (left < 8) left = 8;
  else if (left + popoverWidth > viewportWidth - 8) left = viewportWidth - 8 - popoverWidth;
  const bottomSpace = (typeof window !== "undefined" ? window.innerHeight : 800) - cardRect.bottom;
  const topSpace = cardRect.top;
  const estimatedHeight = popoverWidth * 0.75 + 120;
  let top: number;
  if (bottomSpace >= estimatedHeight || bottomSpace >= topSpace) top = cardRect.top - 20;
  else top = cardRect.bottom - estimatedHeight + 20;
  return { left, top, width: popoverWidth };
}

export function HoverPopover({ content, cardRect, onMouseEnter, onMouseLeave, onExpand }: HoverPopoverProps) {
  const router = useRouter();
  const { isActive } = useSubscription();
  const [showSubscribeGate, setShowSubscribeGate] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Signal hero to stop when popover is active
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("popover-active", { detail: true }));
    return () => { window.dispatchEvent(new CustomEvent("popover-active", { detail: false })); };
  }, []);
  const [tabVisible, setTabVisible] = useState(true);
  const popoverVideoRef = useRef<HTMLVideoElement>(null);
  const { left, top, width } = getPopoverPosition(cardRect);
  const posterSrc = mediaUrl(content.posterPortrait || content.posterLandscape);
  const hasTrailer = !!content.trailerUrl;
  const hasPreview = !!content.previewUrl;

  useEffect(() => {
    const handler = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isActive) { setShowSubscribeGate(true); return; }
    router.push(`/watch/${content.id}`);
  };

  const goToDetail = () => router.push(`/title/${content.id}`);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onAnimationComplete={(def: string) => { if (def === "exit") { const iframes = document.querySelectorAll("iframe[src*=youtube]"); iframes.forEach(f => f.remove()); } }} transition={{ duration: 0.2, ease: "easeOut" }} className="fixed z-50 cursor-pointer" style={{ left, top, width, borderRadius: 6, boxShadow: "0 14px 36px rgba(0,0,0,0.75), 0 6px 12px rgba(0,0,0,0.5)" }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={goToDetail}>
      <div className="relative aspect-video w-full overflow-hidden bg-card" style={{ borderRadius: "6px 6px 0 0" }}>
        {posterSrc && (
          <Image src={posterSrc} alt={content.title} fill className="object-cover" sizes="320px" />
        )}
        {hasTrailer && (
          <div className="absolute inset-0 z-[1]">
            <YouTubeEmbed url={content.trailerUrl!} autoPlay muted={isMuted || !tabVisible} loop playing={tabVisible} className="absolute inset-0 w-full h-full" />
          </div>
        )}
        {!hasTrailer && hasPreview && (
          <video ref={popoverVideoRef} src={mediaUrl(content.previewUrl)} autoPlay muted={isMuted || !tabVisible} loop playsInline className="absolute inset-0 z-[1] h-full w-full object-cover" />
        )}
        <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="absolute bottom-2 right-2 z-10 rounded-full border border-white/40 bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors" aria-label={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? <VolumeOff className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
        <div className="absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-card via-card/50 to-transparent px-3 pb-3 pt-10">
          <p className="text-sm font-bold text-white">{content.title}</p>
        </div>
      </div>
      <div className="bg-card p-3" style={{ borderRadius: "0 0 6px 6px" }}>
        <div className="mb-2.5 flex items-center gap-2">
          <button onClick={handlePlay} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black hover:bg-white/80 transition-colors" aria-label="Play"><Play className="h-4 w-4 fill-current" /></button>
          <div onClick={(e) => e.stopPropagation()}><MyListButton contentId={content.id} size="sm" /></div>
          <button onClick={(e) => e.stopPropagation()} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#555] text-white hover:border-white transition-colors" aria-label="Like"><ThumbsUp className="h-4 w-4" /></button>
          <div className="flex-1" />
          <button className="flex h-8 w-8 items-center justify-center rounded-full border border-[#555] text-white hover:border-white transition-colors" aria-label="More Info" onClick={(e) => { e.stopPropagation(); onExpand?.(); }}><ChevronDown className="h-4 w-4" /></button>
        </div>
        <div className="mb-1.5 flex items-center gap-2 text-xs">
          <span className="font-semibold text-green">98% Match</span>
          {content.ageRating && (<span className="flex h-5 items-center justify-center rounded-sm border border-[#555] px-1.5 text-[11px] text-silver">{content.ageRating}</span>)}
          {content.quality && (<span className="flex h-5 items-center justify-center rounded-sm border border-[#555] px-1.5 text-[11px] text-silver">{content.quality}</span>)}
          {content.duration !== null && content.duration > 0 && (<span className="text-silver">{formatDuration(content.duration)}</span>)}
          {content.releaseYear && (<span className="text-silver">{content.releaseYear}</span>)}
        </div>
        {content.categories.length > 0 && (<p className="text-xs text-silver">{content.categories.slice(0, 3).join(" \u2022 ")}</p>)}
      </div>
      <SubscribeGate isOpen={showSubscribeGate} onClose={() => setShowSubscribeGate(false)} />
    </motion.div>
  );
}

