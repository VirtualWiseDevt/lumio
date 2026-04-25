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

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

let apiLoaded = false;
let apiReady = false;
const readyCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (apiReady) { resolve(); return; }
    readyCallbacks.push(resolve);
    if (apiLoaded) return;
    apiLoaded = true;
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      apiReady = true;
      prev?.();
      readyCallbacks.forEach(cb => cb());
      readyCallbacks.length = 0;
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
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
  const containerRef = useRef<HTMLDivElement>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  // Create YouTube player
  useEffect(() => {
    if (!videoId || !playerDivRef.current) return;
    let destroyed = false;

    loadYouTubeAPI().then(() => {
      if (destroyed || !playerDivRef.current) return;
      const div = document.createElement("div");
      playerDivRef.current.innerHTML = "";
      playerDivRef.current.appendChild(div);

      playerRef.current = new window.YT.Player(div, {
        videoId,
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          mute: 1,
          loop: loop ? 1 : 0,
          playlist: loop ? videoId : undefined,
          controls: 0,
          showinfo: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            if (destroyed) return;
            setIsReady(true);
            if (!muted) {
              try { playerRef.current?.unMute(); } catch {}
            }
          },
          onStateChange: (event: any) => {
            if (event.data === 0) {
              onEndedRef.current?.();
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
      setIsReady(false);
    };
  }, [videoId]);

  // Mute/unmute
  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    try {
      if (muted) playerRef.current.mute();
      else playerRef.current.unMute();
    } catch {}
  }, [muted, isReady]);

  // Play/pause
  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    try {
      if (!playing || isPaused) playerRef.current.pauseVideo();
      else playerRef.current.playVideo();
    } catch {}
  }, [playing, isPaused, isReady]);

  // Fullscreen
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

  if (!videoId) return null;

  if (!showControls) {
    return (
      <div className="relative h-full w-full" style={style}>
        <div ref={playerDivRef} className={className} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", ...(style || {}) }} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="group/yt relative h-full w-full bg-black">
      <div ref={playerDivRef} className={className} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
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