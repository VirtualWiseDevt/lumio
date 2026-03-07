"use client";

import { cn } from "@/lib/utils";
import type { SubscriptionInfo } from "@/types/billing";

interface SubscriptionStatusProps {
  subscription: SubscriptionInfo;
  daysRemaining: number;
  urgency: "green" | "yellow" | "red";
  onRenew: () => void;
}

const urgencyColors = {
  green: "text-green-500",
  yellow: "text-yellow-500",
  red: "text-red-500",
};

const urgencyBgColors = {
  green: "bg-green-500/10",
  yellow: "bg-yellow-500/10",
  red: "bg-red-500/10",
};

export function SubscriptionStatus({
  subscription,
  daysRemaining,
  urgency,
  onRenew,
}: SubscriptionStatusProps) {
  const expiryDate = new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(new Date(subscription.expiresAt));

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-white/60">
            Current Subscription
          </h3>
          <p className="mt-1 text-xl font-semibold text-white">
            {subscription.planName}
          </p>
          <p className="mt-1 text-sm text-white/50">
            Expires {expiryDate}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={cn(
              "rounded-lg px-3 py-2 text-center",
              urgencyBgColors[urgency]
            )}
          >
            <span
              className={cn(
                "text-2xl font-bold",
                urgencyColors[urgency]
              )}
            >
              {daysRemaining}
            </span>
            <p className={cn("text-xs", urgencyColors[urgency])}>
              {daysRemaining === 1 ? "day left" : "days left"}
            </p>
          </div>

          <button
            type="button"
            onClick={onRenew}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/80"
          >
            Renew
          </button>
        </div>
      </div>
    </div>
  );
}
