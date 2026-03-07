"use client";

import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyList } from "@/hooks/use-my-list";

interface MyListButtonProps {
  contentId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
} as const;

const iconSizes = {
  sm: 14,
  md: 18,
  lg: 22,
} as const;

export function MyListButton({
  contentId,
  size = "md",
  className,
}: MyListButtonProps) {
  const { isInList, toggle, isLoading } = useMyList(contentId);

  const Icon = isInList ? Check : Plus;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle();
      }}
      disabled={isLoading}
      aria-label={isInList ? "Remove from My List" : "Add to My List"}
      className={cn(
        "flex items-center justify-center rounded-full border border-white/50",
        "bg-black/40 text-white backdrop-blur-sm",
        "transition-all duration-200 hover:border-white hover:bg-black/60",
        "active:scale-90 disabled:opacity-50",
        sizeClasses[size],
        className
      )}
    >
      <Icon
        size={iconSizes[size]}
        className="transition-opacity duration-200"
      />
    </button>
  );
}
