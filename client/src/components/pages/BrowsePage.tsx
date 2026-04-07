"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { HeroBanner } from "@/components/hero/HeroBanner";
import { ContentRow } from "@/components/content/ContentRow";
import { fetchBrowsePageData } from "@/api/content";
import type { Content } from "@/types/content";

interface BrowsePageProps {
  type: "movies" | "series" | "documentaries";
}

function BrowsePageSkeleton() {
  return (
    <div>
      <div className="w-full bg-card animate-pulse" style={{ height: "90vh" }} />
      <div className="mt-8 space-y-10" style={{ padding: "0 56px" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 w-48 bg-card animate-pulse rounded" />
            <div className="flex gap-[5px] overflow-hidden">
              {Array.from({ length: 6 }).map((_, j) => (
                <div
                  key={j}
                  className="flex-shrink-0 bg-card animate-pulse rounded"
                  style={{ aspectRatio: "16/9", width: "calc((100vw - 112px - 25px) / 6)", minWidth: 200 }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BrowsePage({ type }: BrowsePageProps) {
  const router = useRouter();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["browse", type],
    queryFn: () => fetchBrowsePageData(type),
  });

  const handleCardClick = (content: Content) => {
    router.push(`/title/${content.id}`);
  };

  if (isLoading) {
    return <BrowsePageSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <p className="text-white text-lg">
          Something went wrong loading content.
        </p>
        <p className="text-silver text-sm">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-6 py-2 bg-gold text-black rounded font-semibold hover:bg-gold/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data || data.featured.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p className="text-silver text-lg">No content available yet.</p>
      </div>
    );
  }

  return (
    <div>
      <HeroBanner items={data.featured} />
      <div className="relative z-10 space-y-2" style={{ marginTop: -120, paddingBottom: 60 }}>
        {data.rows.map((row) => (
          <ContentRow
            key={row.slug}
            title={row.title}
            items={row.items}
            onCardClick={handleCardClick}
          />
        ))}
      </div>
    </div>
  );
}
