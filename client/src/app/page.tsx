"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { HeroBanner } from "@/components/hero/HeroBanner";
import { ContentRow } from "@/components/content/ContentRow";
import { ContinueWatchingRow } from "@/components/content/ContinueWatchingRow";
import { ContentCard } from "@/components/content/ContentCard";
import { fetchHomePageData } from "@/api/content";
import { getMyList } from "@/api/my-list";
import { useContentRow } from "@/hooks/use-content-row";
import type { Content } from "@/types/content";
import type { MyListItem } from "@/types/player";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

function MyListRow() {
  const router = useRouter();
  const { scrollRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight } =
    useContentRow();

  const { data: items = [] } = useQuery<MyListItem[]>({
    queryKey: ["my-list"],
    queryFn: getMyList,
    retry: false,
  });

  if (items.length === 0) return null;

  return (
    <section className="group/row relative">
      <h2 className="mb-1 pl-[4%] text-lg font-semibold text-foreground">
        My List
      </h2>
      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className={cn(
              "absolute left-0 top-0 bottom-0 z-10 flex w-10 items-center justify-center",
              "bg-black/50 text-white opacity-0 transition-opacity",
              "group-hover/row:opacity-100 hover:bg-black/70"
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="scrollbar-hide flex flex-nowrap gap-2 overflow-x-auto px-[4%]"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="content-card flex-shrink-0"
              style={{ scrollSnapAlign: "start" }}
            >
              <ContentCard
                content={item.content}
                onClick={() => router.push(`/title/${item.content.id}`)}
              />
            </div>
          ))}
        </div>
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className={cn(
              "absolute right-0 top-0 bottom-0 z-10 flex w-10 items-center justify-center",
              "bg-black/50 text-white opacity-0 transition-opacity",
              "group-hover/row:opacity-100 hover:bg-black/70"
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </section>
  );
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("c");
    if (code) {
      sessionStorage.setItem("referralCode", code);
      router.push(`/register?c=${encodeURIComponent(code)}`);
    }
  }, [searchParams, router]);

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
        <ContinueWatchingRow />
        <MyListRow />
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
