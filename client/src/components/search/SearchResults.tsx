"use client";

import Image from "next/image";
import { cn, mediaUrl } from "@/lib/utils";
import type { Content, SearchResults as SearchResultsType } from "@/types/content";

interface SearchResultsProps {
  results: SearchResultsType;
  onSelect: (content: Content) => void;
}

const groups: { key: keyof SearchResultsType; label: string }[] = [
  { key: "movies", label: "Movies" },
  { key: "series", label: "Series" },
  { key: "documentaries", label: "Documentaries" },
  { key: "channels", label: "Channels" },
];

function ResultCard({
  content,
  onClick,
}: {
  content: Content;
  onClick: () => void;
}) {
  if (!content) return null;
  const posterSrc = mediaUrl(content.posterPortrait);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full rounded-lg p-2 text-left",
        "transition-colors hover:bg-card-hover"
      )}
    >
      <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-card">
        {posterSrc ? (
          <Image
            src={posterSrc}
            alt={content.title}
            fill
            className="object-cover"
            sizes="44px"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-b from-card-hover to-card">
            <span className="text-[10px] text-muted">
              {content.title.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {content.title}
        </p>
        <p className="text-xs text-muted">
          {content.type === "CHANNEL"
            ? "Live Channel"
            : [content.releaseYear, content.categories?.[0]]
                .filter(Boolean)
                .join(" - ")}
        </p>
      </div>
    </button>
  );
}

export function SearchResults({ results, onSelect }: SearchResultsProps) {
  const hasAnyResults = groups.some((g) => results[g.key].length > 0);

  if (!hasAnyResults) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted">
        <p className="text-lg">No results found</p>
        <p className="text-sm mt-1">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const items = results[group.key];
        if (items.length === 0) return null;

        return (
          <div key={group.key}>
            <h3 className="mb-2 text-sm font-semibold text-muted uppercase tracking-wider">
              {group.label}{" "}
              <span className="text-xs font-normal">({items.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {items.map((item) => (
                <ResultCard
                  key={item.id}
                  content={item}
                  onClick={() => onSelect(item)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
