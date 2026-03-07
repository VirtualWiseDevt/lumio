"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchTitleDetail } from "@/api/content";
import { getProgress } from "@/api/progress";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import type { ContentDetail } from "@/types/content";

interface WatchPageProps {
  params: Promise<{ id: string }>;
}

export default function WatchPage({ params }: WatchPageProps) {
  const { id: contentId } = use(params);
  const searchParams = useSearchParams();
  const episodeId = searchParams.get("episode");
  const router = useRouter();

  const [content, setContent] = useState<ContentDetail | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [initialTime, setInitialTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [detail, progress] = await Promise.all([
          fetchTitleDetail(contentId),
          getProgress(contentId, episodeId ?? undefined).catch(() => null),
        ]);

        if (cancelled) return;

        setContent(detail);

        // Determine video source
        let src: string | null = null;

        if (episodeId && detail.seasons) {
          for (const season of detail.seasons) {
            const episode = season.episodes.find((ep) => ep.id === episodeId);
            if (episode?.videoUrl) {
              src = episode.videoUrl;
              break;
            }
          }
        }

        if (!src) {
          src = detail.streamUrl ?? null;
        }

        // Fallback: find first available episode videoUrl
        if (!src && detail.seasons) {
          for (const season of detail.seasons) {
            for (const episode of season.episodes) {
              if (episode.videoUrl) {
                src = episode.videoUrl;
                break;
              }
            }
            if (src) break;
          }
        }

        setVideoSrc(src);

        // Resume from saved progress (if not completed)
        if (progress && !progress.completed) {
          setInitialTime(progress.timestamp);
        }
      } catch {
        // Content not found or error
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [contentId, episodeId]);

  // Set initial time on video once loaded
  useEffect(() => {
    if (initialTime <= 0) return;

    // Small delay to let video element mount
    const timer = setTimeout(() => {
      const video = document.querySelector("video");
      if (video && initialTime > 0) {
        video.currentTime = initialTime;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [initialTime, videoSrc]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (!videoSrc || !content) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-lg text-white">Video not available</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm text-white/60 hover:text-white"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <VideoPlayer
      src={videoSrc}
      title={content.title}
      contentId={contentId}
      episodeId={episodeId}
      onClose={() => router.back()}
    />
  );
}
