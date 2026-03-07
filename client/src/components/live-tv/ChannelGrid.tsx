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
      <div className="flex flex-col items-center justify-center py-24 text-muted">
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
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {category.name}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
