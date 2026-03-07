"use client";

import { useState, useEffect } from "react";
import { usePlayerStore } from "@/stores/player";

export function BufferingIndicator() {
  const bufferingStartTime = usePlayerStore((s) => s.bufferingStartTime);
  const [showSlowHint, setShowSlowHint] = useState(false);

  useEffect(() => {
    if (!bufferingStartTime) {
      setShowSlowHint(false);
      return;
    }

    const interval = setInterval(() => {
      if (Date.now() - bufferingStartTime > 5000) {
        setShowSlowHint(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bufferingStartTime]);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-3 border-white/20 border-t-white" />
      {showSlowHint && (
        <p className="mt-4 text-sm text-white/60">Slow connection</p>
      )}
    </div>
  );
}
