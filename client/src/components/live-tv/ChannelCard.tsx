"use client";

import Image from "next/image";
import Link from "next/link";
import { cn, mediaUrl } from "@/lib/utils";
import type { Content } from "@/types/content";

interface ChannelCardProps {
  channel: Content;
}

export function ChannelCard({ channel }: ChannelCardProps) {
  const posterSrc =
    mediaUrl(channel.posterLandscape) || mediaUrl(channel.posterPortrait);

  return (
    <Link href={`/title/${channel.id}`}>
      <div
        className={cn(
          "rounded-lg bg-card p-4 transition-colors hover:bg-card-hover"
        )}
      >
        {/* Channel image */}
        <div className="relative aspect-video overflow-hidden rounded bg-card">
          {posterSrc ? (
            <Image
              src={posterSrc}
              alt={channel.title}
              fill
              className="object-cover"
              sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-b from-card-hover to-card">
              <span className="text-lg font-bold text-muted">
                {channel.title
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Channel info */}
        <div className="mt-2 flex items-center justify-between">
          <p className="truncate text-sm font-medium text-foreground">
            {channel.title}
          </p>
          <span className="ml-2 inline-flex shrink-0 items-center gap-1 rounded bg-accent px-2 py-0.5 text-xs font-bold text-white">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        </div>
      </div>
    </Link>
  );
}
