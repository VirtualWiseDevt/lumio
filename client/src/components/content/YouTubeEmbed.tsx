"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";

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
    if (!readyRef.current) {
      const timer = setTimeout(() => { postMsg(muted ? "mute" : "unMute"); }, 2000);
      return () => clearTimeout(timer);
    }
    postMsg(muted ? "mute" : "unMute");
  }, [muted, postMsg]);

  useEffect(() => {
    if (!playing || isPaused) postMsg("pauseVideo");
    else postMsg("playVideo");
  }, [playing, isPaused, postMsg]);

  const togglePause = useCallback(() => {
    setIsPaused(p => {
      const next = !p;
      postMsg(next ? "pauseVideo" : "playVideo");
      return next;
    });
  }, [postMsg]);

  const handleFullscreen = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      if (iframe.requestFullscreen) iframe.requestFullscreen();
    }
  }, []);

  if (!videoId) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams({
    autoplay: autoPlay ? "1" : "0",
    mute: "1",
    loop: loop ? "1" : "0",
    playlist: videoId,
    controls: "0",
    showinfo: "0",
    rel: "0",
    modestbranding: "1",
    iv_load_policy: "3",
    disablekb: "1",
    fs: "1",
    playsinline: "1",
    enablejsapi: "1",
    origin,
  });

  return (
    <div className={showControls ? "group/yt relative" : "relative"} style={!showControls ? style : undefined}>
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${videoId}?${params.toString()}`}
        className={className}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        style={{ border: "none", pointerEvents: showControls ? "none" : "none", ...(showControls ? {} : style || {}) }}
        tabIndex={-1}
      />
      {showControls && (
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover/yt:opacity-100 transition-opacity duration-300 cursor-pointer" onClick={togglePause}>
          <div className="absolute inset-0 bg-black/20" />
          <button className="relative z-20 flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors">
            {isPaused ? (
              <svg className="h-8 w-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            ) : (
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            )}
          </button>
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); onToggleMute?.(); }} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors">
              {muted ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
              )}
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleFullscreen(); }} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}