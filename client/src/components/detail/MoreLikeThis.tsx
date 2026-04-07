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
      <h3 className="mb-4 text-xl font-semibold text-white">
        More Like This
      </h3>

      {isLoading && (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="rounded bg-card-hover" style={{ aspectRatio: "16/9" }} />
              <div className="mt-2 h-3 w-3/4 rounded bg-card-hover" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!titles || titles.length === 0) && (
        <p className="text-sm text-silver">No similar titles found</p>
      )}

      {!isLoading && titles && titles.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {titles.map((title) => {
            const posterSrc = mediaUrl(title.posterLandscape || title.posterPortrait);
            return (
              <Link
                key={title.id}
                href={`/title/${title.id}`}
                className="group"
              >
                <div
                  className={cn(
                    "relative overflow-hidden bg-[#222]",
                    "transition-transform duration-200 group-hover:scale-105"
                  )}
                  style={{ aspectRatio: "16/9", borderRadius: 4 }}
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
                      <span className="text-center text-sm text-silver">
                        {title.title}
                      </span>
                    </div>
                  )}
                  {/* Title overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-6">
                    <p className="truncate text-[13px] font-bold text-white">{title.title}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
