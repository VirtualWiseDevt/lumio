"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { searchContent } from "@/api/content";
import { ContentCard } from "@/components/content/ContentCard";
import type { Content } from "@/types/content";

function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchContent(query),
    enabled: query.length >= 1,
  });

  function handleCardClick(content: Content) {
    router.push(`/title/${content.id}`);
  }

  const movies = data?.movies ?? [];
  const series = data?.series ?? [];
  const documentaries = data?.documentaries ?? [];
  const channels = data?.channels ?? [];
  const hasResults = movies.length > 0 || series.length > 0 || documentaries.length > 0 || channels.length > 0;

  return (
    <div className="min-h-screen pt-[68px]" style={{ padding: "68px 56px 60px" }}>
      <h1
        className="text-3xl font-bold text-white mb-8"
        style={{ fontFamily: "var(--font-dm-serif)" }}
      >
        {query ? `Results for '${query}'` : "Search"}
      </h1>

      {!query && (
        <div className="flex flex-col items-center justify-center py-24 text-silver">
          <Search className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-xl">Enter a search term to find content</p>
        </div>
      )}

      {query && isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-[5px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#222] animate-pulse"
              style={{ aspectRatio: "16/9", borderRadius: 4 }}
            />
          ))}
        </div>
      )}

      {query && !isLoading && !hasResults && (
        <div className="flex flex-col items-center justify-center py-24 text-silver">
          <Search className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-xl mb-2">No results found for &apos;{query}&apos;</p>
          <p className="text-sm opacity-70">Try a different search term</p>
        </div>
      )}

      {query && !isLoading && hasResults && (
        <div className="space-y-10">
          <ResultSection
            title="Movies"
            items={movies}
            onCardClick={handleCardClick}
          />
          <ResultSection
            title="Series"
            items={series}
            onCardClick={handleCardClick}
          />
          <ResultSection
            title="Documentaries"
            items={documentaries}
            onCardClick={handleCardClick}
          />
          <ResultSection
            title="Channels"
            items={channels}
            onCardClick={handleCardClick}
          />
        </div>
      )}
    </div>
  );
}

function ResultSection({
  title,
  items,
  onCardClick,
}: {
  title: string;
  items: Content[];
  onCardClick: (content: Content) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-[5px]">
        {items.map((item) => (
          <ContentCard
            key={item.id}
            content={item}
            onClick={() => onCardClick(item)}
          />
        ))}
      </div>
    </section>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-[68px]" style={{ padding: "68px 56px 60px" }}>
          <div className="h-9 w-64 bg-[#222] animate-pulse rounded mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-[5px]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#222] animate-pulse"
                style={{ aspectRatio: "16/9", borderRadius: 4 }}
              />
            ))}
          </div>
        </div>
      }
    >
      <SearchResultsPage />
    </Suspense>
  );
}
