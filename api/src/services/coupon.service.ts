import type { PrismaClient } from "../../generated/prisma/client.js";
import { prisma } from "../config/database.js";

// ─── Types ───────────────────────────────────────────────────────────────────

type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

class ServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface CouponValidation {
  valid: true;
  couponId: string;
  discountPercentage: number;
}

// ─── Validate Coupon ────────────────────────────────────────────────────────

/**
 * Validate a coupon code for a specific user.
 * Checks: active, not expired, type is PERCENTAGE, usage limits, per-user limit.
 * Throws ServiceError with descriptive message on failure.
 */
export async function validateCoupon(
  code: string,
  userId: string,
): Promise<CouponValidation> {
  const coupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (!coupon) {
    throw new ServiceError("Invalid coupon code", 404);
  }

  if (!coupon.isActive) {
    throw new ServiceError("This coupon is no longer active", 400);
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new ServiceError("This coupon has expired", 400);
  }

  if (coupon.type !== "PERCENTAGE") {
    throw new ServiceError("This coupon type is not supported", 400);
  }

  if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
    throw new ServiceError("This coupon has reached its usage limit", 400);
  }

  // Check per-user redemption limit
  const existingRedemption = await prisma.couponRedemption.findUnique({
    where: {
      couponId_userId: {
        couponId: coupon.id,
        userId,
      },
    },
  });

  if (existingRedemption) {
    throw new ServiceError("You have already used this coupon", 400);
  }

  return {
    valid: true,
    couponId: coupon.id,
    discountPercentage: coupon.value,
  };
}

// ─── Redeem Coupon ──────────────────────────────────────────────────────────

/**
 * Record a coupon redemption and increment usage count.
 * Called inside a Prisma $transaction after successful payment.
 */
export async function redeemCoupon(
  tx: TxClient,
  couponId: string,
  userId: string,
  paymentId: string,
): Promise<void> {
  // Create redemption record
  await tx.couponRedemption.create({
    data: {
      couponId,
      userId,
      paymentId,
    },
  });

  // Increment global usage count
  await tx.coupon.update({
    where: { id: couponId },
    data: { currentUses: { increment: 1 } },
  });
}
