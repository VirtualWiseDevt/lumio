"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyList } from "@/api/my-list";
import { ContentCard } from "@/components/content/ContentCard";
import type { MyListItem } from "@/types/player";

function MyListSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[2/3] animate-pulse rounded-md bg-card" />
          <div className="mt-1 h-4 w-3/4 animate-pulse rounded bg-card" />
        </div>
      ))}
    </div>
  );
}

export default function MyListPage() {
  const { data: items, isLoading, isError } = useQuery<MyListItem[]>({
    queryKey: ["my-list"],
    queryFn: getMyList,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">My List</h1>

      {isLoading && <MyListSkeleton />}

      {isError && (
        <p className="text-center text-muted">
          Something went wrong loading your list. Please try again.
        </p>
      )}

      {!isLoading && !isError && items && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-center text-lg text-muted">
            Your list is empty. Add movies and series to keep track of what you
            want to watch.
          </p>
        </div>
      )}

      {!isLoading && !isError && items && items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <ContentCard key={item.id} content={item.content} />
          ))}
        </div>
      )}
    </div>
  );
}
