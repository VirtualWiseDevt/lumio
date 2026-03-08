import cron from "node-cron";
import { prisma } from "../config/database.js";
import { getMpesaClient } from "../config/mpesa.js";
import { activateSubscription } from "../services/subscription.service.js";
import { sendEmail, buildPaymentSuccessEmail } from "../services/email.service.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Terminal result codes from Safaricom STK Query.
 * 0 = success, others = various failure reasons.
 */
function isTerminalResultCode(code: number): boolean {
  return [0, 1, 1032, 1037, 9999].includes(code);
}

const MAX_RECONCILIATION_ATTEMPTS = 5;

// ─── Reconciliation Job ──────────────────────────────────────────────────────

export function startReconciliationJob(): void {
  // Run every 2 minutes
  cron.schedule("*/2 * * * *", async () => {
    try {
      // Find PENDING payments older than 2 minutes with room for retries
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

      const pendingPayments = await prisma.payment.findMany({
        where: {
          status: "PENDING",
          createdAt: { lt: twoMinutesAgo },
          reconciliationAttempts: { lt: MAX_RECONCILIATION_ATTEMPTS },
          checkoutRequestId: { not: null },
        },
      });

      if (pendingPayments.length === 0) {
        return; // Quiet run -- nothing to reconcile
      }

      console.log(
        `[RECONCILIATION] Processing ${pendingPayments.length} pending payment(s)`,
      );

      const mpesa = await getMpesaClient();

      for (const payment of pendingPayments) {
        try {
          // Increment attempts first (prevents concurrent processing)
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              reconciliationAttempts: { increment: 1 },
            },
          });

          const result = await mpesa.querySTKStatus(
            payment.checkoutRequestId!,
          );

          if (result.ResultCode === 0) {
            // Success -- activate subscription atomically
            await prisma.$transaction(async (tx) => {
              await tx.payment.update({
                where: { id: payment.id },
                data: {
                  status: "SUCCESS",
                  resultCode: String(result.ResultCode),
                  resultDesc: result.ResultDesc,
                },
              });

              await activateSubscription(tx, payment.id);
            });

            console.log(
              `[RECONCILIATION] Resolved payment ${payment.id} as SUCCESS`,
            );

            // Send payment confirmation email for reconciled payment
            const reconciledPayment = await prisma.payment.findUnique({
              where: { id: payment.id },
              include: { user: true, plan: true },
            });
            if (reconciledPayment) {
              const sub = await prisma.subscription.findFirst({
                where: { userId: payment.userId, status: "ACTIVE" },
                orderBy: { expiresAt: "desc" },
              });
              const email = buildPaymentSuccessEmail(reconciledPayment.user.name, {
                amount: reconciledPayment.amount,
                planName: reconciledPayment.plan.name,
                duration: `${reconciledPayment.plan.durationDays} days`,
                expiresAt: sub?.expiresAt ?? new Date(),
                mpesaReceipt: result.ResultDesc ?? null,
              });
              sendEmail(reconciledPayment.user.email, email.subject, email.html, email.text)
                .catch((err) => console.error("[EMAIL] Reconciliation confirmation email failed:", err));
            }
          } else if (isTerminalResultCode(result.ResultCode)) {
            // Terminal failure -- mark as FAILED
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: "FAILED",
                resultCode: String(result.ResultCode),
                resultDesc: result.ResultDesc,
              },
            });

            console.log(
              `[RECONCILIATION] Resolved payment ${payment.id} as FAILED: ${result.ResultDesc}`,
            );
          }
          // Non-terminal (e.g., 1001 system busy): leave as PENDING for next cron run

          // Check if max attempts reached and still unresolved
          if (
            payment.reconciliationAttempts + 1 >= MAX_RECONCILIATION_ATTEMPTS &&
            !isTerminalResultCode(result.ResultCode)
          ) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: "FAILED",
                resultDesc: "Reconciliation timeout",
              },
            });

            console.log(
              `[RECONCILIATION] Payment ${payment.id} failed after ${MAX_RECONCILIATION_ATTEMPTS} attempts`,
            );
          }
        } catch (error) {
          // One payment failure shouldn't stop others
          console.error(
            `[RECONCILIATION] Error processing payment ${payment.id}:`,
            error,
          );
        }
      }
    } catch (error) {
      console.error("[RECONCILIATION] Job error:", error);
    }
  });

  console.log(
    "[RECONCILIATION] Scheduled every 2 minutes for lost M-Pesa callbacks",
  );
}
