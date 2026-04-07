"use client";

import { Suspense, useEffect } from "react";
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
    <section className="group/row relative mb-12">
      <div className="mb-2 flex items-center justify-between" style={{ padding: "0 56px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#e5e5e5" }}>My List</h2>
        <span className="text-sm text-gold opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer hover:underline">
          Explore All
        </span>
      </div>
      <div className="relative" style={{ padding: "0 56px" }}>
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className={cn(
              "absolute top-0 bottom-0 z-10 flex items-center justify-center",
              "text-white opacity-0 transition-opacity",
              "group-hover/row:opacity-100"
            )}
            style={{
              left: 0,
              width: 56,
              background: "linear-gradient(to right, rgba(20,20,20,0.8), transparent)",
            }}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="scrollbar-hide flex flex-nowrap gap-[5px] overflow-x-auto"
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
              "absolute top-0 bottom-0 z-10 flex items-center justify-center",
              "text-white opacity-0 transition-opacity",
              "group-hover/row:opacity-100"
            )}
            style={{
              right: 0,
              width: 56,
              background: "linear-gradient(to left, rgba(20,20,20,0.8), transparent)",
            }}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        )}
      </div>
    </section>
  );
}

function ReferralRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("c");
    if (code) {
      sessionStorage.setItem("referralCode", code);
      router.push(`/register?c=${encodeURIComponent(code)}`);
    }
  }, [searchParams, router]);

  return null;
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
        <p className="text-white text-lg">
          Something went wrong loading the home page.
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

  const hasContent = data && (data.featured.length > 0 || data.rows.some((r) => r.items.length > 0));

  if (!hasContent) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p className="text-silver text-lg">No content available yet.</p>
      </div>
    );
  }

  return (
    <div>
      <Suspense><ReferralRedirect /></Suspense>
      {data.featured.length > 0 && <HeroBanner items={data.featured} />}
      <div className="relative z-10 space-y-2" style={{ marginTop: -120, paddingBottom: 60 }}>
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

