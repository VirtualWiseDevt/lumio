"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { Play, Pause, Volume2, VolumeOff, Maximize, Minimize } from "lucide-react";

interface YouTubeEmbedProps {
  url: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  playing?: boolean;
  style?: React.CSSProperties;
  showControls?: boolean;
  onToggleMute?: () => void;
  onEnded?: () => void;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function YouTubeEmbed({
  url,
  autoPlay = true,
  muted = true,
  loop = true,
  className = "",
  playing = true,
  style,
  showControls = false,
  onToggleMute,
  onEnded,
}: YouTubeEmbedProps) {
  const videoId = extractYouTubeId(url);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const postMsg = useCallback((func: string) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !isReady) return;
    iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func, args: "" }), "*");
  }, [isReady]);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 1500);
    return () => clearTimeout(timer);
  }, [videoId]);

  useEffect(() => { if (isReady) postMsg(muted ? "mute" : "unMute"); }, [muted, isReady, postMsg]);

  useEffect(() => {
    if (!isReady) return;
    if (!playing || isPaused) postMsg("pauseVideo");
    else postMsg("playVideo");
  }, [playing, isPaused, isReady, postMsg]);

  // Listen for YouTube state changes via postMessage
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data.info && data.info.playerState === 0) {
          onEndedRef.current?.();
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const togglePause = useCallback(() => setIsPaused(p => !p), []);
  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen().catch(() => {});
  }, []);

  const embedSrc = useMemo(() => {
    if (!videoId) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&mute=1&loop=${loop ? 1 : 0}&playlist=${loop ? videoId : ""}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1&origin=${origin}`;
  }, [videoId, autoPlay, loop]);

  if (!videoId) return null;

  if (!showControls) {
    return (
      <div className="relative h-full w-full" style={style}>
        <iframe ref={iframeRef} src={embedSrc} className={className} allow="autoplay; encrypted-media" style={{ border: "none", pointerEvents: "none", position: "absolute", inset: 0, width: "100%", height: "100%", ...(style || {}) }} tabIndex={-1} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="group/yt relative h-full w-full bg-black">
      <iframe ref={iframeRef} src={embedSrc} className={className} allow="autoplay; encrypted-media; fullscreen" allowFullScreen style={{ border: "none", pointerEvents: "none", position: "absolute", inset: 0, width: "100%", height: "100%" }} tabIndex={-1} />
      <div className="absolute inset-0 z-10 cursor-pointer" style={{ right: 48 }} onClick={togglePause} />
      {isPaused && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
            <Play className="h-10 w-10 text-white ml-1" fill="white" />
          </div>
        </div>
      )}
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 opacity-0 group-hover/yt:opacity-100 transition-opacity" style={{ pointerEvents: "auto" }}>
        <button onClick={(e) => { e.stopPropagation(); togglePause(); }} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer">
          {isPaused ? <Play className="h-5 w-5 ml-0.5" fill="white" /> : <Pause className="h-5 w-5" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onToggleMute?.(); }} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer">
          {muted ? <VolumeOff className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleFullscreen(); }} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer">
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}