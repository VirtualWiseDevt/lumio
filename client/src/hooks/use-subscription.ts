"use client";

import { useQuery } from "@tanstack/react-query";
import { getSubscription } from "@/api/billing";
import type { SubscriptionInfo } from "@/types/billing";

export function useSubscription() {
  const {
    data: subscription,
    isLoading,
    error,
    refetch,
  } = useQuery<SubscriptionInfo | null>({
    queryKey: ["subscription"],
    queryFn: getSubscription,
    staleTime: 60_000,
    retry: false,
  });

  const isActive =
    !!subscription && new Date(subscription.expiresAt) > new Date();

  const daysRemaining = subscription
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.expiresAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const urgency: "green" | "yellow" | "red" =
    daysRemaining >= 7 ? "green" : daysRemaining >= 3 ? "yellow" : "red";

  return {
    subscription,
    isActive,
    isLoading,
    error,
    daysRemaining,
    urgency,
    refetch,
  };
}
