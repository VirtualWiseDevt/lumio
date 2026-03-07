"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { HeroBanner } from "@/components/hero/HeroBanner";
import { ContentRow } from "@/components/content/ContentRow";
import { fetchHomePageData } from "@/api/content";
import type { Content } from "@/types/content";

function HomePageSkeleton() {
  return (
    <div>
      <div className="aspect-video w-full bg-card animate-pulse" />
      <div className="px-4 md:px-12 mt-8 space-y-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 w-48 bg-card animate-pulse rounded" />
            <div className="flex gap-2 overflow-hidden">
              {Array.from({ length: 6 }).map((_, j) => (
                <div
                  key={j}
                  className="flex-shrink-0 aspect-[2/3] w-[160px] bg-card animate-pulse rounded"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["home"],
    queryFn: fetchHomePageData,
  });

  const handleCardClick = (content: Content) => {
    router.push(`/title/${content.id}`);
  };

  if (isLoading) {
    return <HomePageSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <p className="text-foreground text-lg">
          Something went wrong loading the home page.
        </p>
        <p className="text-muted text-sm">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-6 py-2 bg-accent text-white rounded hover:bg-accent/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data || data.featured.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p className="text-muted text-lg">No content available yet.</p>
      </div>
    );
  }

  return (
    <div>
      <HeroBanner items={data.featured} />
      <div className="px-4 md:px-12 -mt-16 relative z-10 space-y-2 pb-16">
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
