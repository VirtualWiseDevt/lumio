"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getUserSubscription } from "@/api/user";

function daysRemaining(endDate: string): number {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}

export function SubscriptionSection() {
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["userSubscription"],
    queryFn: getUserSubscription,
  });

  if (isLoading) {
    return (
      <section className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Subscription</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-40 rounded bg-white/10" />
          <div className="h-4 w-32 rounded bg-white/10" />
        </div>
      </section>
    );
  }

  if (!subscription) {
    return (
      <section className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Subscription</h2>
        <p className="mb-3 text-sm text-gray-400">No active subscription</p>
        <Link
          href="/billing"
          className="inline-block rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Subscribe
        </Link>
      </section>
    );
  }

  const days = daysRemaining(subscription.endDate);
  const isActive = subscription.status === "active";

  return (
    <section className="rounded-lg border border-white/10 bg-white/5 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Subscription</h2>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Plan:</span>
          <span className="text-sm font-medium text-white">
            {subscription.planName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Status:</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isActive
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {subscription.status}
          </span>
        </div>

        {isActive && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Days remaining:</span>
            <span className="text-sm text-white">{days}</span>
          </div>
        )}

        <Link
          href="/billing"
          className="mt-2 inline-block text-sm text-red-500 hover:text-red-400"
        >
          Manage Subscription
        </Link>
      </div>
    </section>
  );
}
