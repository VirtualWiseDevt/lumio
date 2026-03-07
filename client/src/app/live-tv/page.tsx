"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchLiveTvData } from "@/api/content";
import { ChannelGrid } from "@/components/live-tv/ChannelGrid";

export default function LiveTvPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["live-tv"],
    queryFn: fetchLiveTvData,
  });

  return (
    <div className="px-4 pt-24 pb-12 md:px-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Live TV</h1>

      {isLoading && (
        <div className="space-y-10">
          {[1, 2].map((i) => (
            <div key={i}>
              <div className="mb-4 h-6 w-32 rounded bg-card animate-pulse" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="rounded-lg bg-card p-4">
                    <div className="aspect-video rounded bg-card-hover animate-pulse" />
                    <div className="mt-2 flex items-center justify-between">
                      <div className="h-4 w-20 rounded bg-card-hover animate-pulse" />
                      <div className="h-5 w-12 rounded bg-card-hover animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-24 text-muted">
          <p className="text-lg">Failed to load channels</p>
          <p className="mt-1 text-sm">Please try again later</p>
        </div>
      )}

      {data && <ChannelGrid categories={data.categories} />}
    </div>
  );
}
