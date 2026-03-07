"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPlans } from "@/api/billing";
import { getUserProfile } from "@/api/user";
import { useSubscription } from "@/hooks/use-subscription";
import { PlanGrid } from "@/components/billing/PlanGrid";
import { SubscriptionStatus } from "@/components/billing/SubscriptionStatus";
import { PaymentModal } from "@/components/billing/PaymentModal";
import { PaymentHistory } from "@/components/billing/PaymentHistory";
import type { Plan } from "@/types/billing";

export default function BillingPage() {
  const queryClient = useQueryClient();
  const { subscription, isActive, daysRemaining, urgency, isLoading: subLoading } =
    useSubscription();

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
  });

  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
    retry: false,
  });

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const planSectionRef = useRef<HTMLDivElement>(null);

  const handleSelectPlan = useCallback((plan: Plan) => {
    setSelectedPlan(plan);
  }, []);

  const handleOpenPaymentModal = useCallback(() => {
    if (selectedPlan) {
      setIsPaymentModalOpen(true);
    }
  }, [selectedPlan]);

  const handleRenew = useCallback(() => {
    planSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
    queryClient.invalidateQueries({ queryKey: ["payment-history"] });
  }, [queryClient]);

  const handleCloseModal = useCallback(() => {
    setIsPaymentModalOpen(false);
  }, []);

  return (
    <main className="min-h-screen bg-background pb-16 pt-24">
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <h1 className="mb-8 text-3xl font-bold text-white">
          {isActive ? "Billing" : "Choose Your Plan"}
        </h1>

        {/* Subscription Status (active subscribers only) */}
        {subLoading ? (
          <div className="mb-8 h-24 animate-pulse rounded-xl bg-white/5" />
        ) : (
          isActive &&
          subscription && (
            <div className="mb-8">
              <SubscriptionStatus
                subscription={subscription}
                daysRemaining={daysRemaining}
                urgency={urgency}
                onRenew={handleRenew}
              />
            </div>
          )
        )}

        {/* Value pitch for first-time users */}
        {!subLoading && !isActive && (
          <p className="mb-8 text-lg text-white/60">
            Stream unlimited movies, series &amp; documentaries
          </p>
        )}

        {/* Plan Selection */}
        <div ref={planSectionRef}>
          {plansLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-xl bg-white/5"
                />
              ))}
            </div>
          ) : plans ? (
            <PlanGrid
              plans={plans}
              selectedPlanId={selectedPlan?.id ?? null}
              currentPlanName={subscription?.planName ?? null}
              onSelectPlan={handleSelectPlan}
            />
          ) : null}
        </div>

        {/* Pay Button */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleOpenPaymentModal}
            disabled={!selectedPlan}
            className="rounded-lg bg-green-600 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Pay with M-Pesa
          </button>
        </div>

        {/* Payment History */}
        <div className="mt-12">
          <PaymentHistory />
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleCloseModal}
          plan={selectedPlan}
          userPhone={profile?.phone ?? ""}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </main>
  );
}
