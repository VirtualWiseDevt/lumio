"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, updatePreferences, getUserSubscription } from "@/api/user";

export function PreferencesSection() {
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
  });

  const { data: subscription } = useQuery({
    queryKey: ["userSubscription"],
    queryFn: getUserSubscription,
  });

  const newsletterMutation = useMutation({
    mutationFn: (newsletter: boolean) => updatePreferences({ newsletter }),
    onMutate: async (newsletter) => {
      await queryClient.cancelQueries({ queryKey: ["userProfile"] });
      const previous = queryClient.getQueryData<typeof profile>(["userProfile"]);
      if (previous) {
        queryClient.setQueryData(["userProfile"], {
          ...previous,
          newsletter,
        });
      }
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["userProfile"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });

  // UserProfile type doesn't have newsletter field currently,
  // so we default to false. The optimistic update adds it dynamically.
  const newsletterValue = (profile as unknown as Record<string, unknown> | undefined)?.newsletter === true;

  return (
    <section className="rounded-lg border border-white/10 bg-white/5 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Preferences</h2>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">
              Email Newsletter
            </p>
            <p className="text-xs text-gray-500">
              Receive updates about new content and features
            </p>
          </div>
          <button
            role="switch"
            aria-checked={newsletterValue}
            onClick={() => newsletterMutation.mutate(!newsletterValue)}
            disabled={newsletterMutation.isPending}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 ${
              newsletterValue ? "bg-red-600" : "bg-white/20"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                newsletterValue ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">
              Auto-Renew Subscription
            </p>
            <p className="text-xs text-gray-500">
              Available when subscription management launches
            </p>
          </div>
          <button
            role="switch"
            aria-checked={subscription?.autoRenew ?? false}
            disabled
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed items-center rounded-full opacity-50 ${
              subscription?.autoRenew ? "bg-red-600" : "bg-white/20"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                subscription?.autoRenew ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
