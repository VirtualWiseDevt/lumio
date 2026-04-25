"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";

interface YouTubeEmbedProps {
  url: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  playing?: boolean;
  style?: React.CSSProperties;
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
}: YouTubeEmbedProps) {
  const videoId = extractYouTubeId(url);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);

  const postMsg = useCallback((func: string) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !readyRef.current) return;
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func, args: "" }),
      "*"
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { readyRef.current = true; }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    postMsg(muted ? "mute" : "unMute");
  }, [muted, postMsg]);

  useEffect(() => {
    postMsg(playing ? "playVideo" : "pauseVideo");
  }, [playing, postMsg]);

  const embedSrc = useMemo(() => {
    if (!videoId) return "";
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
      fs: "0",
      playsinline: "1",
      enablejsapi: "1",
      origin,
    });
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }, [videoId, autoPlay, loop]);

  if (!videoId) return null;

  return (
    <iframe
      ref={iframeRef}
      src={embedSrc}
      className={className}
      allow="autoplay; encrypted-media"
      allowFullScreen={false}
      style={{ border: "none", pointerEvents: "none", ...style }}
      tabIndex={-1}
    />
  );
}