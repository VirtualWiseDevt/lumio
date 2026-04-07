"use client";

import Image from "next/image";
import Link from "next/link";
import { mediaUrl } from "@/lib/utils";
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
        className="bg-card transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)]"
        style={{ borderRadius: 6 }}
      >
        {/* Channel image */}
        <div className="relative overflow-hidden bg-[#222]" style={{ aspectRatio: "16/9", borderRadius: "6px 6px 0 0" }}>
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
              <span className="text-lg font-bold text-silver">
                {channel.title
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
          )}
          {/* LIVE badge */}
          <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded bg-red px-2 py-0.5 text-xs font-bold text-white">
            <span className="h-2 w-2 rounded-full bg-white live-dot" />
            LIVE
          </span>
        </div>

        {/* Channel info */}
        <div className="p-3">
          <p className="text-[15px] font-bold text-white truncate">
            {channel.title}
          </p>
          {channel.categories.length > 0 && (
            <p className="mt-0.5 text-xs text-gold">
              {channel.categories[0]}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
