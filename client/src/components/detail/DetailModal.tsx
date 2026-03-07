"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { X, Play, Plus } from "lucide-react";
import { cn, formatDuration, mediaUrl } from "@/lib/utils";
import { fetchTitleDetail } from "@/api/content";
import { EpisodeList } from "./EpisodeList";
import { MoreLikeThis } from "./MoreLikeThis";

interface DetailModalProps {
  id: string;
  isFullPage?: boolean;
}

export function DetailModal({ id, isFullPage = false }: DetailModalProps) {
  const router = useRouter();

  const { data: content, isLoading, isError, refetch } = useQuery({
    queryKey: ["title", id],
    queryFn: () => fetchTitleDetail(id),
  });

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  // Close on Escape key
  useEffect(() => {
    if (isFullPage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullPage, handleClose]);

  // Prevent body scroll when modal is open
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
        "relative rounded-t-lg bg-card",
        isFullPage ? "mx-auto max-w-4xl" : "mx-auto max-w-4xl overflow-y-auto",
        !isFullPage && "max-h-[90vh]"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close button */}
      {!isFullPage && (
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 text-foreground transition-colors hover:bg-card"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Loading state */}
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

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center gap-4 p-16">
          <p className="text-muted">Failed to load title details</p>
          <button
            onClick={() => refetch()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Content */}
      {content && (
        <>
          {/* Header / Backdrop */}
          <div className="relative aspect-video w-full overflow-hidden">
            {content.posterLandscape ? (
              <Image
                src={mediaUrl(content.posterLandscape)}
                alt={content.title}
                fill
                className="object-cover"
                sizes="(min-width: 896px) 896px, 100vw"
                priority
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-b from-card-hover to-card" />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

            {/* Title and buttons */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                {content.title}
              </h1>
              <div className="flex gap-3">
                <button
                  className={cn(
                    "flex items-center gap-2 rounded-md px-6 py-2 text-sm font-semibold transition-colors",
                    "bg-white text-black hover:bg-white/80"
                  )}
                >
                  <Play className="h-5 w-5 fill-current" />
                  Play
                </button>
                <button
                  className={cn(
                    "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors",
                    "border border-border bg-card/60 text-foreground hover:bg-card-hover"
                  )}
                >
                  <Plus className="h-5 w-5" />
                  My List
                </button>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="px-8 py-6">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
              {content.releaseYear && (
                <span className="text-foreground">{content.releaseYear}</span>
              )}
              {content.duration && (
                <span className="text-foreground">
                  {formatDuration(content.duration)}
                </span>
              )}
              {content.quality && (
                <span className="rounded border border-border px-1.5 py-0.5 text-xs font-medium text-foreground">
                  {content.quality}
                </span>
              )}
              {content.ageRating && (
                <span className="rounded border border-border px-1.5 py-0.5 text-xs font-medium text-foreground">
                  {content.ageRating}
                </span>
              )}
            </div>

            {content.description && (
              <p className="mb-4 text-sm leading-relaxed text-foreground">
                {content.description}
              </p>
            )}

            <div className="space-y-1 text-sm">
              {content.cast.length > 0 && (
                <p>
                  <span className="text-muted">Cast: </span>
                  <span className="text-foreground">
                    {content.cast.join(", ")}
                  </span>
                </p>
              )}
              {content.director && (
                <p>
                  <span className="text-muted">Director: </span>
                  <span className="text-foreground">{content.director}</span>
                </p>
              )}
              {content.categories.length > 0 && (
                <p>
                  <span className="text-muted">Genres: </span>
                  <span className="text-foreground">
                    {content.categories.join(", ")}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Episodes (series only) */}
          {content.type === "SERIES" &&
            content.seasons &&
            content.seasons.length > 0 && (
              <EpisodeList seasons={content.seasons} />
            )}

          {/* More Like This */}
          <MoreLikeThis contentId={id} />
        </>
      )}
    </div>
  );

  // Full page: no overlay
  if (isFullPage) {
    return <div className="pb-16 pt-4">{modalContent}</div>;
  }

  // Modal: overlay with animation
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/70"
          onClick={handleClose}
        />

        {/* Modal container */}
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
  );
}
