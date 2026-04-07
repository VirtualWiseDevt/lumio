"use client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import { getMyList } from "@/api/my-list";
import { ContentCard } from "@/components/content/ContentCard";
import { HoverPopover } from "@/components/content/HoverPopover";
import { useHoverPopover } from "@/hooks/use-hover-popover";
import type { Content } from "@/types/content";
import type { MyListItem } from "@/types/player";

function MyListSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i}>
          <div className="animate-pulse rounded bg-card" style={{ aspectRatio: "16/9" }} />
        </div>
      ))}
    </div>
  );
}

export default function MyListPage() {
  const router = useRouter();
  const { data: items, isLoading, isError } = useQuery<MyListItem[]>({
    queryKey: ["my-list"],
    queryFn: getMyList,
  });

  const {
    activeId,
    cardRect,
    onCardMouseEnter,
    onCardMouseLeave,
    onPopoverMouseEnter,
    onPopoverMouseLeave,
  } = useHoverPopover();

  const activeContent = activeId
    ? items?.find((item) => item.content.id === activeId)?.content ?? null
    : null;

  function handleCardClick(content: Content) {
    router.push(`/title/${content.id}`);
  }

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ padding: "96px 56px 64px" }}>
      <h1 className="mb-8 font-serif text-3xl text-white">My List</h1>
      {isLoading && <MyListSkeleton />}
      {isError && (
        <p className="text-center text-silver">
          Something went wrong loading your list. Please try again.
        </p>
      )}
      {!isLoading && !isError && items && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-center text-lg text-silver">
            Your list is empty. Add movies and series to keep track of what you
            want to watch.
          </p>
        </div>
      )}
      {!isLoading && !isError && items && items.length > 0 && (
        <div className="relative">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((item) => (
              <ContentCard
                key={item.id}
                content={item.content}
                onMouseEnter={onCardMouseEnter}
                onMouseLeave={onCardMouseLeave}
                onClick={() => handleCardClick(item.content)}
              />
            ))}
          </div>
          <AnimatePresence>
            {activeContent && cardRect && (
              <HoverPopover
                key={activeContent.id}
                content={activeContent}
                cardRect={cardRect}
                onMouseEnter={onPopoverMouseEnter}
                onMouseLeave={onPopoverMouseLeave}
                onExpand={() => handleCardClick(activeContent)}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
