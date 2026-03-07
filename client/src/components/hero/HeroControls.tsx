"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface HeroControlsProps {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function HeroControls({ count, activeIndex, onSelect }: HeroControlsProps) {
  if (count <= 1) return null;

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          aria-label={`Go to slide ${i + 1}`}
          className="group relative flex h-4 items-center justify-center"
        >
          <motion.div
            className={cn(
              "h-1 rounded-full transition-colors",
              i === activeIndex ? "bg-white" : "bg-white/50 group-hover:bg-white/70"
            )}
            animate={{
              width: i === activeIndex ? 32 : 8,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </button>
      ))}
    </div>
  );
}
