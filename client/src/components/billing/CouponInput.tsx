"use client";

import { useState } from "react";
import { validateCoupon } from "@/api/billing";

interface CouponInputProps {
  onCouponApplied: (discountPercentage: number, couponCode: string) => void;
  onCouponRemoved: () => void;
}

export function CouponInput({
  onCouponApplied,
  onCouponRemoved,
}: CouponInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim() || isValidating) return;

    setIsValidating(true);
    setError(null);

    const result = await validateCoupon(code.trim());

    if (result.valid && result.discountPercentage) {
      setAppliedCode(code.trim());
      setAppliedDiscount(result.discountPercentage);
      onCouponApplied(result.discountPercentage, code.trim());
    } else {
      setError(result.message ?? "Invalid coupon code");
    }

    setIsValidating(false);
  };

  const handleRemove = () => {
    setAppliedCode(null);
    setAppliedDiscount(null);
    setCode("");
    setError(null);
    onCouponRemoved();
  };

  if (!isExpanded && !appliedCode) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="text-sm text-primary transition-colors hover:text-primary/80"
      >
        Have a promo code?
      </button>
    );
  }

  if (appliedCode && appliedDiscount) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm text-green-400">
          {appliedDiscount}% discount applied!
        </p>
        <button
          type="button"
          onClick={handleRemove}
          className="text-sm text-white/40 transition-colors hover:text-white/60"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          placeholder="Enter promo code"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={!code.trim() || isValidating}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isValidating ? "..." : "Apply"}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
