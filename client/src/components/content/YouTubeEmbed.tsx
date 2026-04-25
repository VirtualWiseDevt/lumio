"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { Play, Pause, Volume2, VolumeOff, Maximize } from "lucide-react";

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
  const readyRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  const postMsg = useCallback((func: string) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !readyRef.current) return;
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func, args: "" }),
      "*"
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { readyRef.current = true; }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { postMsg(muted ? "mute" : "unMute"); }, 2000);
    return () => clearTimeout(timer);
  }, [muted, postMsg]);

  useEffect(() => {
    if (!playing || isPaused) postMsg("pauseVideo");
    else postMsg("playVideo");
  }, [playing, isPaused, postMsg]);

  const togglePause = useCallback(() => {
    setIsPaused(p => !p);
  }, []);

  const handleFullscreen = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe?.requestFullscreen) iframe.requestFullscreen();
  }, []);

  const embedSrc = useMemo(() => {
    if (!videoId) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&mute=1&loop=${loop ? 1 : 0}&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=1&playsinline=1&enablejsapi=1&origin=${origin}`;
  }, [videoId, autoPlay, loop]);

  if (!videoId) return null;

  return (
    <div className={showControls ? "group/yt relative h-full w-full" : "relative h-full w-full"} style={!showControls ? style : undefined}>
      <iframe
        ref={iframeRef}
        src={embedSrc}
        className={className}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        style={{ border: "none", pointerEvents: "none", ...(showControls ? {} : style || {}) }}
        tabIndex={-1}
      />
      {showControls && (
        <>
          <div className="absolute inset-0 z-10 cursor-pointer" onClick={togglePause} />
          {isPaused && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                <Play className="h-10 w-10 text-white ml-1" fill="white" />
              </div>
            </div>
          )}
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 opacity-0 group-hover/yt:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); togglePause(); }} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
              {isPaused ? <Play className="h-4 w-4 ml-0.5" fill="white" /> : <Pause className="h-4 w-4" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onToggleMute?.(); }} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
              {muted ? <VolumeOff className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleFullscreen(); }} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

