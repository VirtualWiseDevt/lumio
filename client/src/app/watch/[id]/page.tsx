"use client";

import { useEffect, useState, useMemo, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchTitleDetail, getStreamUrl } from "@/api/content";
import { getProgress } from "@/api/progress";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { SubscribeGate } from "@/components/billing/SubscribeGate";
import { useSubscription } from "@/hooks/use-subscription";
import type { NextEpisodeInfo } from "@/components/player/NextEpisodeOverlay";
import type { ContentDetail } from "@/types/content";

function resolveNextEpisode(
  content: ContentDetail,
  episodeId: string | null
): { info: NextEpisodeInfo; episodeId: string } | null {
  if (!content.seasons || !episodeId) return null;

  // Find current episode position
  for (let si = 0; si < content.seasons.length; si++) {
    const season = content.seasons[si];
    for (let ei = 0; ei < season.episodes.length; ei++) {
      if (season.episodes[ei].id === episodeId) {
        // Check next episode in same season
        if (ei + 1 < season.episodes.length) {
          const next = season.episodes[ei + 1];
          return {
            info: {
              title: next.title,
              thumbnail: next.thumbnail,
              seasonNumber: season.number,
              episodeNumber: next.number,
            },
            episodeId: next.id,
          };
        }
        // Check first episode of next season
        if (si + 1 < content.seasons.length) {
          const nextSeason = content.seasons[si + 1];
          if (nextSeason.episodes.length > 0) {
            const next = nextSeason.episodes[0];
            return {
              info: {
                title: next.title,
                thumbnail: next.thumbnail,
                seasonNumber: nextSeason.number,
                episodeNumber: next.number,
              },
              episodeId: next.id,
            };
          }
        }
        // No next episode
        return null;
      }
    }
  }
  return null;
}

interface WatchPageProps {
  params: Promise<{ id: string }>;
}

export default function WatchPage({ params }: WatchPageProps) {
  const { id: contentId } = use(params);
  const searchParams = useSearchParams();
  const episodeId = searchParams.get("episode");
  const router = useRouter();

  const { isActive: isSubscribed, isLoading: isSubLoading } = useSubscription();

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
        // Prefer HLS stream endpoint for transcoded content, fall back to direct URLs
        let src: string | null = null;

        if (episodeId && detail.seasons) {
          // Find the current episode
          let episode: typeof detail.seasons[0]["episodes"][0] | undefined;
          for (const season of detail.seasons) {
            episode = season.episodes.find((ep) => ep.id === episodeId);
            if (episode) break;
          }

          if (episode) {
            // Use stream endpoint if episode is transcoded
            if (episode.hlsKey) {
              src = getStreamUrl(contentId, episodeId);
            } else if (episode.videoUrl) {
              src = episode.videoUrl;
            }
          }
        }

        // Non-episode content: use stream endpoint if transcoded
        if (!src && detail.hlsKey) {
          src = getStreamUrl(contentId);
        }

        // Fall back to direct streamUrl
        if (!src) {
          src = detail.streamUrl ?? null;
        }

        // Fallback: find first available episode videoUrl
        if (!src && detail.seasons) {
          for (const season of detail.seasons) {
            for (const episode of season.episodes) {
              if (episode.hlsKey) {
                src = getStreamUrl(contentId, episode.id);
                break;
              }
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

  // Resolve next episode from content detail
  const nextEpisodeData = useMemo(
    () => (content ? resolveNextEpisode(content, episodeId) : null),
    [content, episodeId]
  );

  // Set initial time on video via loadedmetadata for reliability
  useEffect(() => {
    if (initialTime <= 0) return;

    const handleLoadedMetadata = () => {
      const video = document.querySelector("video");
      if (video && initialTime > 0) {
        video.currentTime = initialTime;
      }
    };

    // Small delay to let video element mount
    const timer = setTimeout(() => {
      const video = document.querySelector("video");
      if (video) {
        if (video.readyState >= 1) {
          video.currentTime = initialTime;
        } else {
          video.addEventListener("loadedmetadata", handleLoadedMetadata, {
            once: true,
          });
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      const video = document.querySelector("video");
      video?.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [initialTime, videoSrc]);

  // Show loading while checking subscription
  if (isSubLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  // Block playback for expired/unsubscribed users
  if (!isSubscribed) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black" />
        <SubscribeGate isOpen onClose={() => router.back()} />
      </>
    );
  }

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
      nextEpisode={nextEpisodeData?.info ?? null}
      onNextEpisode={
        nextEpisodeData
          ? () =>
              router.replace(
                `/watch/${contentId}?episode=${nextEpisodeData.episodeId}`
              )
          : undefined
      }
    />
  );
}
