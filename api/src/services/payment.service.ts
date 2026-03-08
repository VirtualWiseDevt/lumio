import crypto from "node:crypto";
import type { Prisma, PrismaClient } from "../generated/prisma/client.js";
import { prisma } from "../config/database.js";
import { getMpesaClient } from "../config/mpesa.js";
import { normalizePhoneForDaraja } from "../utils/phone.js";
import { activateSubscription } from "./subscription.service.js";
import { validateCoupon, redeemCoupon } from "./coupon.service.js";
import { grantReferralCredit } from "./referral.service.js";
import type { CallbackInput } from "../validators/payment.validators.js";
import { sendEmail, buildPaymentSuccessEmail, buildPaymentFailureEmail } from "./email.service.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface CallbackMetadataItem {
  Name: string;
  Value?: string | number;
}

function extractCallbackMetadata(items: CallbackMetadataItem[]) {
  const get = (name: string) => items.find((i) => i.Name === name)?.Value;
  return {
    amount: get("Amount") as number | undefined,
    mpesaReceiptNumber: get("MpesaReceiptNumber") as string | undefined,
    transactionDate: get("TransactionDate") as string | number | undefined,
    phoneNumber: get("PhoneNumber") as string | number | undefined,
  };
}

// ─── Initiate Payment ────────────────────────────────────────────────────────

export async function initiatePayment(
  userId: string,
  planId: string,
  phone: string,
  couponCode?: string,
): Promise<{
  paymentId: string;
  checkoutRequestId: string;
  isExisting: boolean;
}> {
  // Double-payment protection: check for existing PENDING payment
  const existing = await prisma.payment.findFirst({
    where: { userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  if (existing && existing.checkoutRequestId) {
    return {
      paymentId: existing.id,
      checkoutRequestId: existing.checkoutRequestId,
      isExisting: true,
    };
  }

  // Look up the plan
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) {
    const err = new Error("Plan not found or inactive") as Error & {
      statusCode: number;
    };
    err.statusCode = 404;
    throw err;
  }

  // ─── Calculate discounts (coupon first, then referral credits) ───
  let couponId: string | undefined;
  let couponDiscount = 0;

  if (couponCode) {
    const couponResult = await validateCoupon(couponCode, userId);
    couponId = couponResult.couponId;
    couponDiscount = Math.round(plan.price * (couponResult.discountPercentage / 100));
  }

  const afterCoupon = plan.price - couponDiscount;

  // Fetch user's referral credit balance
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { referralCreditBalance: true },
  });
  const creditsUsed = Math.min(user.referralCreditBalance, afterCoupon);
  const finalAmount = afterCoupon - creditsUsed;

  // ─── KES 0 path: fully covered by credits/coupon ───
  if (finalAmount <= 0) {
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          userId,
          planId,
          amount: 0,
          discount: couponDiscount + creditsUsed,
          status: "SUCCESS",
          method: "CREDITS",
          couponId: couponId ?? null,
          couponDiscount,
          referralCreditsUsed: creditsUsed,
          idempotencyKey: crypto.randomUUID(),
        },
      });

      // Deduct referral credits
      if (creditsUsed > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { referralCreditBalance: { decrement: creditsUsed } },
        });
      }

      // Redeem coupon
      if (couponId) {
        await redeemCoupon(tx, couponId, userId, payment.id);
      }

      // Activate subscription
      await activateSubscription(tx, payment.id);

      // Grant referral credit to referrer on referee's first payment
      await grantReferralCreditIfFirst(tx, userId, payment.id);

      return payment;
    });

    // Fire-and-forget payment success email for credits-only payment
    const kes0Payment = await prisma.payment.findUnique({
      where: { id: result.id },
      include: { user: true, plan: true },
    });
    if (kes0Payment) {
      const sub = await prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE" },
        orderBy: { expiresAt: "desc" },
      });
      const successEmail = buildPaymentSuccessEmail(kes0Payment.user.name, {
        amount: 0,
        planName: kes0Payment.plan.name,
        duration: `${kes0Payment.plan.durationDays} days`,
        expiresAt: sub?.expiresAt ?? new Date(),
        mpesaReceipt: null,
        couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
        creditsUsed: creditsUsed > 0 ? creditsUsed : undefined,
      });
      sendEmail(kes0Payment.user.email, successEmail.subject, successEmail.html, successEmail.text)
        .catch((err) => console.error("[EMAIL] Payment success email failed:", err));
    }

    return {
      paymentId: result.id,
      checkoutRequestId: "CREDITS",
      isExisting: false,
    };
  }

  // ─── Normal M-Pesa path ───
  const normalizedPhone = normalizePhoneForDaraja(phone);
  const idempotencyKey = crypto.randomUUID();

  const payment = await prisma.payment.create({
    data: {
      userId,
      planId,
      amount: finalAmount,
      discount: couponDiscount + creditsUsed,
      phoneNumber: normalizedPhone,
      idempotencyKey,
      status: "PENDING",
      couponId: couponId ?? null,
      couponDiscount,
      referralCreditsUsed: creditsUsed,
    },
  });

  try {
    // Initiate STK Push with the discounted amount
    const mpesa = await getMpesaClient();
    const stkResponse = await mpesa.initiateSTKPush({
      phone: normalizedPhone,
      amount: finalAmount,
      accountRef: plan.name,
    });

    // Update payment with checkout request ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: { checkoutRequestId: stkResponse.CheckoutRequestID },
    });

    return {
      paymentId: payment.id,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      isExisting: false,
    };
  } catch (error) {
    // STK Push failed -- mark payment as FAILED
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        resultDesc:
          error instanceof Error ? error.message : "STK Push initiation failed",
      },
    });
    throw error;
  }
}

// ─── Grant Referral Credit (First Payment Check) ────────────────────────────

/**
 * Check if this is the referee's first successful payment and grant
 * referral credit to the referrer if so. Called inside a transaction.
 */
type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

async function grantReferralCreditIfFirst(
  tx: TxClient,
  userId: string,
  currentPaymentId: string,
): Promise<void> {
  // Count successful payments for this user (including the current one)
  const successCount = await tx.payment.count({
    where: { userId, status: "SUCCESS" },
  });

  // Only grant on first successful payment
  if (successCount === 1) {
    await grantReferralCredit(tx, userId);
  }
}

// ─── Process Callback ────────────────────────────────────────────────────────

export async function processCallback(
  callbackData: CallbackInput,
): Promise<void> {
  const { stkCallback } = callbackData.Body;
  const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

  // Find PENDING payment by checkoutRequestId (idempotent: already-processed payments are skipped)
  const payment = await prisma.payment.findFirst({
    where: {
      checkoutRequestId: CheckoutRequestID,
      status: "PENDING",
    },
  });

  if (!payment) {
    // Duplicate callback or already processed -- safe to ignore
    console.log(
      `[payment] Ignoring callback for ${CheckoutRequestID}: no PENDING payment found`,
    );
    return;
  }

  if (ResultCode === 0) {
    // Success -- extract metadata and activate subscription atomically
    const metadata = stkCallback.CallbackMetadata
      ? extractCallbackMetadata(stkCallback.CallbackMetadata.Item)
      : { amount: undefined, mpesaReceiptNumber: undefined, transactionDate: undefined, phoneNumber: undefined };

    await prisma.$transaction(async (tx) => {
      // Update payment to SUCCESS
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          mpesaReceiptNumber: metadata.mpesaReceiptNumber ?? null,
          resultCode: String(ResultCode),
          resultDesc: ResultDesc,
          rawCallback: callbackData as unknown as Prisma.InputJsonValue,
        },
      });

      // Deduct referral credits used (deferred from initiation for safety)
      if (payment.referralCreditsUsed > 0) {
        await tx.user.update({
          where: { id: payment.userId },
          data: { referralCreditBalance: { decrement: payment.referralCreditsUsed } },
        });
      }

      // Redeem coupon (deferred from initiation for safety)
      if (payment.couponId) {
        await redeemCoupon(tx, payment.couponId, payment.userId, payment.id);
      }

      // Grant referral credit to referrer on referee's first successful payment
      await grantReferralCreditIfFirst(tx, payment.userId, payment.id);

      // Activate subscription within the same transaction
      await activateSubscription(tx, payment.id);
    });

    // Fire-and-forget payment success email (NOTF-02)
    const successPayment = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: { user: true, plan: true },
    });
    if (successPayment) {
      const sub = await prisma.subscription.findFirst({
        where: { userId: payment.userId, status: "ACTIVE" },
        orderBy: { expiresAt: "desc" },
      });
      const successEmail = buildPaymentSuccessEmail(successPayment.user.name, {
        amount: successPayment.amount,
        planName: successPayment.plan.name,
        duration: `${successPayment.plan.durationDays} days`,
        expiresAt: sub?.expiresAt ?? new Date(),
        mpesaReceipt: metadata.mpesaReceiptNumber ?? null,
        couponDiscount: successPayment.couponDiscount > 0 ? successPayment.couponDiscount : undefined,
        creditsUsed: successPayment.referralCreditsUsed > 0 ? successPayment.referralCreditsUsed : undefined,
      });
      sendEmail(successPayment.user.email, successEmail.subject, successEmail.html, successEmail.text)
        .catch((err) => console.error("[EMAIL] Payment success email failed:", err));
    }
  } else {
    // Failure -- update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        resultCode: String(ResultCode),
        resultDesc: ResultDesc,
        rawCallback: callbackData as unknown as Prisma.InputJsonValue,
      },
    });

    // Fire-and-forget payment failure email (NOTF-03)
    const failedPayment = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: { user: true, plan: true },
    });
    if (failedPayment) {
      const failEmail = buildPaymentFailureEmail(failedPayment.user.name, {
        planName: failedPayment.plan.name,
        amount: failedPayment.amount,
      });
      sendEmail(failedPayment.user.email, failEmail.subject, failEmail.html, failEmail.text)
        .catch((err) => console.error("[EMAIL] Payment failure email failed:", err));
    }
  }
}

// ─── Get Payment Status ──────────────────────────────────────────────────────

export async function getPaymentStatus(
  paymentId: string,
  userId: string,
): Promise<{
  status: string;
  mpesaReceiptNumber: string | null;
  planName: string;
}> {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId },
    include: { plan: true },
  });

  if (!payment) {
    const err = new Error("Payment not found") as Error & {
      statusCode: number;
    };
    err.statusCode = 404;
    throw err;
  }

  return {
    status: payment.status,
    mpesaReceiptNumber: payment.mpesaReceiptNumber,
    planName: payment.plan.name,
  };
}

// ─── Get Payment History ─────────────────────────────────────────────────────

export async function getPaymentHistory(
  userId: string,
  page: number,
  limit: number,
): Promise<{
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    method: string;
    mpesaReceiptNumber: string | null;
    phoneNumber: string | null;
    createdAt: Date;
    planName: string;
  }>;
  total: number;
  page: number;
  totalPages: number;
}> {
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { plan: true },
    }),
    prisma.payment.count({ where: { userId } }),
  ]);

  return {
    payments: payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      method: p.method,
      mpesaReceiptNumber: p.mpesaReceiptNumber,
      phoneNumber: p.phoneNumber,
      createdAt: p.createdAt,
      planName: p.plan.name,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
