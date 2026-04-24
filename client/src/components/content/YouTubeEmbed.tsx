"use client";

interface YouTubeEmbedProps {
  url: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
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
}: YouTubeEmbedProps) {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  const params = new URLSearchParams({
    autoplay: autoPlay ? "1" : "0",
    mute: muted ? "1" : "0",
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
  });

  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}?${params.toString()}`}
      className={className}
      allow="autoplay; encrypted-media"
      allowFullScreen={false}
      style={{ border: "none", pointerEvents: "none" }}
      tabIndex={-1}
    />
  );
}
