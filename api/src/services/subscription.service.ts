import type { PrismaClient } from "../generated/prisma/client.js";
import { prisma } from "../config/database.js";

// ─── Types ───────────────────────────────────────────────────────────────────

type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

// ─── Activate Subscription ──────────────────────────────────────────────────

/**
 * Activate a subscription after successful payment.
 * Must be called within a Prisma $transaction (receives tx client).
 *
 * Handles subscription stacking: if user has an active subscription,
 * the new one extends from the existing expiry date.
 */
export async function activateSubscription(
  tx: TxClient,
  paymentId: string,
): Promise<void> {
  // Fetch the payment with plan relation
  const payment = await tx.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: { plan: true },
  });

  const { userId, planId, plan } = payment;

  // Check for existing active subscription (for stacking)
  const existingSubscription = await tx.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "desc" },
  });

  // Calculate start and expiry
  const startsAt = existingSubscription
    ? existingSubscription.expiresAt
    : new Date();
  const expiresAt = new Date(startsAt);
  expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

  // Create new subscription
  await tx.subscription.create({
    data: {
      userId,
      planId,
      status: "ACTIVE",
      startsAt,
      expiresAt,
    },
  });

  // If extending, expire the old subscription (replaced by new one)
  if (existingSubscription) {
    await tx.subscription.update({
      where: { id: existingSubscription.id },
      data: { status: "EXPIRED" },
    });
  }
}

// ─── Has Active Subscription ────────────────────────────────────────────────

/**
 * Check if a user has an active, non-expired subscription.
 */
export async function hasActiveSubscription(
  userId: string,
): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
  });

  return subscription !== null;
}

// ─── Get Active Subscription ────────────────────────────────────────────────

/**
 * Get the user's active subscription with plan details.
 * Returns null if no active subscription exists.
 */
export async function getActiveSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "desc" },
    include: { plan: true },
  });

  return subscription;
}
