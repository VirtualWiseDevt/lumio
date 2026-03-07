"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface HoverPopoverState {
  activeId: string | null;
  cardRect: DOMRect | null;
}

interface UseHoverPopoverReturn {
  activeId: string | null;
  cardRect: DOMRect | null;
  onCardMouseEnter: (id: string, el: HTMLElement) => void;
  onCardMouseLeave: () => void;
  onPopoverMouseEnter: () => void;
  onPopoverMouseLeave: () => void;
}

export function useHoverPopover(): UseHoverPopoverReturn {
  const [state, setState] = useState<HoverPopoverState>({
    activeId: null,
    cardRect: null,
  });

  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const onCardMouseEnter = useCallback(
    (id: string, el: HTMLElement) => {
      clearCloseTimer();
      clearOpenTimer();

      openTimerRef.current = setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setState({ activeId: id, cardRect: rect });
      }, 500);
    },
    [clearCloseTimer, clearOpenTimer]
  );

  const onCardMouseLeave = useCallback(() => {
    clearOpenTimer();
    closeTimerRef.current = setTimeout(() => {
      setState({ activeId: null, cardRect: null });
    }, 100);
  }, [clearOpenTimer]);

  const onPopoverMouseEnter = useCallback(() => {
    clearCloseTimer();
  }, [clearCloseTimer]);

  const onPopoverMouseLeave = useCallback(() => {
    clearOpenTimer();
    setState({ activeId: null, cardRect: null });
  }, [clearOpenTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (openTimerRef.current !== null) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current);
    };
  }, []);

  return {
    activeId: state.activeId,
    cardRect: state.cardRect,
    onCardMouseEnter,
    onCardMouseLeave,
    onPopoverMouseEnter,
    onPopoverMouseLeave,
  };
}
