"use client";

import { PlanCard } from "./PlanCard";
import type { Plan } from "@/types/billing";

interface PlanGridProps {
  plans: Plan[];
  selectedPlanId: string | null;
  currentPlanName: string | null;
  onSelectPlan: (plan: Plan) => void;
}

export function PlanGrid({
  plans,
  selectedPlanId,
  currentPlanName,
  onSelectPlan,
}: PlanGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isSelected={plan.id === selectedPlanId}
          isRecommended={plan.name === "Monthly"}
          isCurrentPlan={plan.name === currentPlanName}
          onSelect={onSelectPlan}
        />
      ))}
    </div>
  );
}
