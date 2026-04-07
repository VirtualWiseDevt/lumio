"use client";

import { ChannelCard } from "./ChannelCard";
import type { Content } from "@/types/content";

interface ChannelGridProps {
  categories: {
    name: string;
    channels: Content[];
  }[];
}

export function ChannelGrid({ categories }: ChannelGridProps) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-silver">
        <p className="text-lg">No live channels available</p>
        <p className="mt-1 text-sm">Check back later for live content</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {categories.map((category) => {
        if (category.channels.length === 0) return null;

        return (
          <section key={category.name}>
            <h2 className="mb-4 text-lg font-semibold text-[#e5e5e5]">
              {category.name}
            </h2>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
              {category.channels.map((channel) => (
                <ChannelCard key={channel.id} channel={channel} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
