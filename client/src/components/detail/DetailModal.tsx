"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { X, Play } from "lucide-react";
import { cn, formatDuration, mediaUrl } from "@/lib/utils";
import { fetchTitleDetail } from "@/api/content";
import { MyListButton } from "@/components/my-list/MyListButton";
import { SubscribeGate } from "@/components/billing/SubscribeGate";
import { useSubscription } from "@/hooks/use-subscription";

import { EpisodeList } from "./EpisodeList";
import { MoreLikeThis } from "./MoreLikeThis";

interface DetailModalProps {
  id: string;
  isFullPage?: boolean;
}

export function DetailModal({ id, isFullPage = false }: DetailModalProps) {
  const router = useRouter();
  const { isActive } = useSubscription();
  const [showSubscribeGate, setShowSubscribeGate] = useState(false);

  const { data: content, isLoading, isError, refetch } = useQuery({
    queryKey: ["title", id],
    queryFn: () => fetchTitleDetail(id),
  });

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    if (isFullPage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullPage, handleClose]);

  useEffect(() => {
    if (isFullPage) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullPage]);

  const modalContent = (
    <div
      className={cn(
        "relative bg-[#181818]",
        isFullPage ? "mx-auto max-w-[900px]" : "mx-auto max-w-[900px] overflow-y-auto",
        !isFullPage && "max-h-[90vh]"
      )}
      style={{ borderRadius: 8 }}
      onClick={(e) => e.stopPropagation()}
    >
      {!isFullPage && (
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-[100] flex h-9 w-9 items-center justify-center rounded-full bg-[#181818] text-white transition-colors hover:bg-[#333]"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {isLoading && (
        <div className="animate-pulse">
          <div className="aspect-video w-full bg-card-hover" />
          <div className="space-y-3 p-8">
            <div className="h-8 w-2/3 rounded bg-card-hover" />
            <div className="h-4 w-1/3 rounded bg-card-hover" />
            <div className="h-20 w-full rounded bg-card-hover" />
          </div>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center gap-4 p-16">
          <p className="text-silver">Failed to load title details</p>
          <button
            onClick={() => refetch()}
            className="rounded bg-gold px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold/90"
          >
            Try Again
          </button>
        </div>
      )}

      {content && (
        <>
          <div className="relative aspect-video w-full overflow-hidden">
            {content.trailerUrl ? (
              <video
                src={mediaUrl(content.trailerUrl)}
                poster={content.posterLandscape ? mediaUrl(content.posterLandscape) : undefined}
                autoPlay
                muted
                playsInline
                controls
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : content.posterLandscape ? (
              <Image
                src={mediaUrl(content.posterLandscape)}
                alt={content.title}
                fill
                className="object-cover"
                sizes="(min-width: 900px) 900px, 100vw"
                priority
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-b from-card-hover to-card" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/40 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h1 className="mb-4 font-serif text-3xl text-white md:text-4xl" style={{ fontWeight: 700 }}>
                {content.title}
              </h1>
              {content.tagline && (
                <p className="mb-3 text-base italic text-silver">{content.tagline}</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (!isActive) {
                      setShowSubscribeGate(true);
                      return;
                    }
                    const watchUrl =
                      content.type === "SERIES" &&
                      content.seasons &&
                      content.seasons.length > 0 &&
                      content.seasons[0].episodes &&
                      content.seasons[0].episodes.length > 0
                        ? `/watch/${content.id}?episode=${content.seasons[0].episodes[0].id}`
                        : `/watch/${content.id}`;
                    window.location.href = watchUrl;
                  }}
                  className="flex items-center gap-2 bg-white text-black font-bold hover:bg-white/80 transition-colors"
                  style={{ padding: "10px 28px", borderRadius: 4 }}
                >
                  <Play className="h-5 w-5 fill-current" />
                  Play
                </button>
                <MyListButton contentId={content.id} size="md" />
              </div>
            </div>
          </div>

          <div className="flex gap-8 px-8 py-6">
            <div className="flex-1 min-w-0">
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-semibold text-green">98% Match</span>
                {content.releaseYear && (
                  <span className="text-white">{content.releaseYear}</span>
                )}
                {content.duration && (
                  <span className="text-white">
                    {formatDuration(content.duration)}
                  </span>
                )}
                {content.quality && (
                  <span className="rounded border border-[#555] px-1.5 py-0.5 text-xs text-white">
                    {content.quality}
                  </span>
                )}
                {content.ageRating && (
                  <span className="rounded border border-[#555] px-1.5 py-0.5 text-xs text-white">
                    {content.ageRating}
                  </span>
                )}
              </div>

              {content.description && (
                <p className="mb-4 text-sm text-[#ddd]" style={{ lineHeight: 1.7 }}>
                  {content.description}
                </p>
              )}
            </div>

            <div className="hidden md:block w-[200px] shrink-0 space-y-2 text-[13px]">
              {content.cast.length > 0 && (
                <p>
                  <span className="text-silver">Cast: </span>
                  <span className="font-semibold text-white">
                    {content.cast.join(", ")}
                  </span>
                </p>
              )}
              {content.director && (
                <p>
                  <span className="text-silver">Director: </span>
                  <span className="font-semibold text-white">{content.director}</span>
                </p>
              )}
              {content.categories.length > 0 && (
                <p>
                  <span className="text-silver">Genres: </span>
                  <span className="font-semibold text-white">
                    {content.categories.join(", ")}
                  </span>
                </p>
              )}
            </div>
          </div>

          {content.type === "SERIES" &&
            content.seasons &&
            content.seasons.length > 0 && (
              <EpisodeList seasons={content.seasons} />
            )}

          <MoreLikeThis contentId={id} />
        </>
      )}
    </div>
  );

  const subscribeGateEl = (
    <SubscribeGate
      isOpen={showSubscribeGate}
      onClose={() => setShowSubscribeGate(false)}
    />
  );

  if (isFullPage) {
    return (
      <>
        <div className="pb-16 pt-4">{modalContent}</div>
        {subscribeGateEl}
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="fixed inset-0"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={handleClose}
          />
          <div className="relative mt-8 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {modalContent}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      {subscribeGateEl}
    </>
  );
}