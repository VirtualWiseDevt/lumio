import crypto from "node:crypto";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/database.js";
import { getMpesaClient } from "../config/mpesa.js";
import { normalizePhoneForDaraja } from "../utils/phone.js";
import { activateSubscription } from "./subscription.service.js";
import type { CallbackInput } from "../validators/payment.validators.js";

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

  // Normalize phone for Daraja
  const normalizedPhone = normalizePhoneForDaraja(phone);

  // Create PENDING payment record
  const idempotencyKey = crypto.randomUUID();
  const payment = await prisma.payment.create({
    data: {
      userId,
      planId,
      amount: plan.price,
      phoneNumber: normalizedPhone,
      idempotencyKey,
      status: "PENDING",
    },
  });

  try {
    // Initiate STK Push
    const mpesa = await getMpesaClient();
    const stkResponse = await mpesa.initiateSTKPush({
      phone: normalizedPhone,
      amount: plan.price,
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

      // Activate subscription within the same transaction
      await activateSubscription(tx, payment.id);
    });
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
