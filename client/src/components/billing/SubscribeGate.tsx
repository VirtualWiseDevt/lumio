"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { PlayCircle } from "lucide-react";

interface SubscribeGateProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscribeGate({ isOpen, onClose }: SubscribeGateProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="mx-4 w-full max-w-md rounded-xl bg-card p-8 text-center shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <PlayCircle className="mx-auto mb-4 h-14 w-14 text-accent" />

            <h2 className="mb-2 text-xl font-bold text-foreground">
              Subscribe to continue watching
            </h2>

            <p className="mb-6 text-sm text-muted">
              Get unlimited access to movies, series, and documentaries
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/billing"
                className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                View Plans
              </Link>

              <button
                onClick={onClose}
                className="rounded-md px-6 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
