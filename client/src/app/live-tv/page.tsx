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
    <div className="pt-24 pb-12" style={{ padding: "96px 56px 48px" }}>
      <h1 className="mb-8 font-serif text-4xl text-white">Live TV</h1>

      {isLoading && (
        <div className="space-y-10">
          {[1, 2].map((i) => (
            <div key={i}>
              <div className="mb-4 h-6 w-32 rounded bg-card animate-pulse" />
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="rounded-md bg-card p-4">
                    <div className="rounded bg-card-hover animate-pulse" style={{ aspectRatio: "16/9" }} />
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
        <div className="flex flex-col items-center justify-center py-24 text-silver">
          <p className="text-lg">Failed to load channels</p>
          <p className="mt-1 text-sm">Please try again later</p>
        </div>
      )}

      {data && <ChannelGrid categories={data.categories} />}
    </div>
  );
}
