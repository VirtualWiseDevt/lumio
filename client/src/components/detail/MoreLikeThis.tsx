"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { cn, mediaUrl } from "@/lib/utils";
import { fetchSimilarTitles } from "@/api/content";

interface MoreLikeThisProps {
  contentId: string;
}

export function MoreLikeThis({ contentId }: MoreLikeThisProps) {
  const { data: titles, isLoading } = useQuery({
    queryKey: ["similar", contentId],
    queryFn: () => fetchSimilarTitles(contentId),
  });

  return (
    <div className="px-8 py-6">
      <h3 className="mb-4 text-xl font-semibold text-foreground">
        More Like This
      </h3>

      {isLoading && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] rounded-md bg-card-hover" />
              <div className="mt-2 h-3 w-3/4 rounded bg-card-hover" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!titles || titles.length === 0) && (
        <p className="text-sm text-muted">No similar titles found</p>
      )}

      {!isLoading && titles && titles.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {titles.map((title) => {
            const posterSrc = mediaUrl(title.posterPortrait);
            return (
              <Link
                key={title.id}
                href={`/title/${title.id}`}
                className="group"
              >
                <div
                  className={cn(
                    "relative aspect-[2/3] overflow-hidden rounded-md bg-card",
                    "transition-transform duration-200 group-hover:scale-105"
                  )}
                >
                  {posterSrc ? (
                    <Image
                      src={posterSrc}
                      alt={title.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 200px, 150px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-b from-card-hover to-card p-2">
                      <span className="text-center text-sm text-muted">
                        {title.title}
                      </span>
                    </div>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-foreground">
                  {title.title}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
