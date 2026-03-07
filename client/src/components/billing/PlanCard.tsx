"use client";

import { cn } from "@/lib/utils";
import type { Plan } from "@/types/billing";

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  isRecommended: boolean;
  isCurrentPlan: boolean;
  onSelect: (plan: Plan) => void;
}

export function PlanCard({
  plan,
  isSelected,
  isRecommended,
  isCurrentPlan,
  onSelect,
}: PlanCardProps) {
  const pricePerDay = Math.round(plan.price / plan.durationDays);

  const durationLabel =
    plan.durationDays === 1
      ? "1 day"
      : `${plan.durationDays} days`;

  return (
    <button
      type="button"
      onClick={() => onSelect(plan)}
      className={cn(
        "relative flex flex-col items-center rounded-xl p-6 text-center transition-all hover:shadow-lg",
        "border border-white/10 bg-white/5",
        isSelected && "border-primary bg-primary/10 ring-2 ring-primary",
        isRecommended &&
          !isSelected &&
          "border-primary/50 ring-1 ring-primary/50",
        "cursor-pointer"
      )}
    >
      {isRecommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
          Best Value
        </span>
      )}

      {isCurrentPlan && (
        <span className="absolute -top-3 right-3 rounded-full bg-white/20 px-3 py-0.5 text-xs font-medium text-white/80">
          Current Plan
        </span>
      )}

      <h3 className="mt-2 text-lg font-semibold text-white">{plan.name}</h3>

      <div className="mt-4">
        <span className="text-3xl font-bold text-white">
          KES {plan.price.toLocaleString()}
        </span>
      </div>

      <p className="mt-1 text-sm text-white/60">{durationLabel}</p>

      <p className="mt-3 text-sm text-white/40">
        KES {pricePerDay}/day
      </p>
    </button>
  );
}
