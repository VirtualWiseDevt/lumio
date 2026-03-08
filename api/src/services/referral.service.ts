import type { PrismaClient } from "../generated/prisma/client.js";
import { prisma } from "../config/database.js";
import { sendEmail, buildReferralRewardEmail } from "./email.service.js";

// ─── Types ───────────────────────────────────────────────────────────────────

type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

interface ReferralValidation {
  valid: boolean;
  referrerName?: string;
}

interface ReferralStats {
  friendsJoined: number;
  creditsEarned: number;
  currentBalance: number;
}

// ─── Validate Referral Code ─────────────────────────────────────────────────

/**
 * Look up a user by their referral code.
 * Returns the referrer's display name in "FirstName LastInitial." format.
 */
export async function validateReferralCode(
  code: string,
): Promise<ReferralValidation> {
  const user = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { name: true },
  });

  if (!user) {
    return { valid: false };
  }

  const parts = user.name.trim().split(/\s+/);
  const displayName =
    parts.length > 1
      ? `${parts[0]} ${parts[parts.length - 1][0]}.`
      : parts[0];

  return { valid: true, referrerName: displayName };
}

// ─── Get Referral Stats ─────────────────────────────────────────────────────

/**
 * Get referral statistics for a user.
 * friendsJoined = count of referrals made.
 * creditsEarned = sum of creditAmount across all referrals (lifetime).
 * currentBalance = current spendable referralCreditBalance.
 */
export async function getReferralStats(
  userId: string,
): Promise<ReferralStats> {
  const [referrals, user] = await Promise.all([
    prisma.referral.findMany({
      where: { referrerId: userId },
      select: { creditAmount: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { referralCreditBalance: true },
    }),
  ]);

  const friendsJoined = referrals.length;
  const creditsEarned = referrals.reduce((sum, r) => sum + r.creditAmount, 0);
  const currentBalance = user?.referralCreditBalance ?? 0;

  return { friendsJoined, creditsEarned, currentBalance };
}

// ─── Grant Referral Credit ──────────────────────────────────────────────────

/**
 * Grant referral credit to the referrer when referee completes their first payment.
 * Called inside a Prisma $transaction.
 *
 * Credit = 10% of the referrer's own plan price.
 * Balance is capped at 100% of the referrer's plan price (10 referrals = free streaming).
 * If the cap is reached, the referral is still marked as redeemed but no credit is added.
 */
export async function grantReferralCredit(
  tx: TxClient,
  refereeUserId: string,
): Promise<void> {
  // Find unredeemed referral for this referee
  const referral = await tx.referral.findUnique({
    where: { refereeId: refereeUserId },
  });

  if (!referral || referral.isRedeemed) return;

  // Get referrer's active subscription to determine plan price
  const referrerSub = await tx.subscription.findFirst({
    where: {
      userId: referral.referrerId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    include: { plan: true },
  });

  // No active subscription -- skip granting (credit = 0)
  if (!referrerSub) {
    await tx.referral.update({
      where: { id: referral.id },
      data: { isRedeemed: true, creditAmount: 0 },
    });
    return;
  }

  const planPrice = referrerSub.plan.price;
  const credit = Math.round(planPrice * 0.1);

  // Fetch referrer's current balance to enforce 100% cap
  const referrer = await tx.user.findUniqueOrThrow({
    where: { id: referral.referrerId },
    select: { referralCreditBalance: true },
  });

  const currentBalance = referrer.referralCreditBalance;
  const maxCredit = planPrice; // 100% of plan price
  const cappedCredit = Math.min(credit, maxCredit - currentBalance);

  if (cappedCredit <= 0) {
    // Referrer has hit their cap -- mark redeemed but don't increment
    await tx.referral.update({
      where: { id: referral.id },
      data: { isRedeemed: true, creditAmount: 0 },
    });
    return;
  }

  // Grant capped credit
  await tx.referral.update({
    where: { id: referral.id },
    data: { isRedeemed: true, creditAmount: cappedCredit },
  });

  await tx.user.update({
    where: { id: referral.referrerId },
    data: { referralCreditBalance: { increment: cappedCredit } },
  });

  // Fire-and-forget referral reward email to the referrer (NOTF-06)
  const [referrerUser, refereeUser] = await Promise.all([
    tx.user.findUnique({ where: { id: referral.referrerId }, select: { name: true, email: true } }),
    tx.user.findUnique({ where: { id: refereeUserId }, select: { name: true } }),
  ]);
  if (referrerUser && refereeUser) {
    const rewardEmail = buildReferralRewardEmail(referrerUser.name, {
      refereeName: refereeUser.name,
      creditsEarned: cappedCredit,
      newBalance: currentBalance + cappedCredit,
    });
    sendEmail(referrerUser.email, rewardEmail.subject, rewardEmail.html, rewardEmail.text)
      .catch((err) => console.error("[EMAIL] Referral reward email failed:", err));
  }
}
