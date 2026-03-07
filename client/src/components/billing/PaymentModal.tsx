"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { initiatePayment, pollPaymentStatus } from "@/api/billing";
import type { Plan } from "@/types/billing";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
  userPhone: string;
  onSuccess: () => void;
}

type Step = "confirm" | "waiting" | "result";
type Result = "success" | "failed" | "timeout" | null;

export function PaymentModal({
  isOpen,
  onClose,
  plan,
  userPhone,
  onSuccess,
}: PaymentModalProps) {
  const [step, setStep] = useState<Step>("confirm");
  const [result, setResult] = useState<Result>(null);
  const [phone, setPhone] = useState(userPhone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const pollingRef = useRef(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("confirm");
      setResult(null);
      setPhone(userPhone);
      setIsSubmitting(false);
      setError(null);
      setReceiptNumber(null);
      setPlanName(null);
      pollingRef.current = false;
    }
  }, [isOpen, userPhone]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || pollingRef.current) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await initiatePayment(plan.id, phone);

      setStep("waiting");
      pollingRef.current = true;

      const pollResult = await pollPaymentStatus(response.paymentId);
      pollingRef.current = false;

      if (pollResult.success) {
        setReceiptNumber(pollResult.data?.mpesaReceiptNumber ?? null);
        setPlanName(pollResult.data?.planName ?? plan.name);
        setResult("success");
        setStep("result");
      } else if (pollResult.timeout) {
        setResult("timeout");
        setStep("result");
      } else {
        setResult("failed");
        setStep("result");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initiate payment"
      );
      setIsSubmitting(false);
    }
  }, [isSubmitting, plan.id, plan.name, phone]);

  const handleRetry = useCallback(() => {
    setStep("confirm");
    setResult(null);
    setIsSubmitting(false);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    pollingRef.current = false;
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  const handleDone = useCallback(() => {
    onSuccess();
    handleClose();
  }, [onSuccess, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={step === "waiting" ? undefined : handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
        <AnimatePresence mode="wait">
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-semibold text-white">
                Confirm Payment
              </h2>
              <p className="mt-2 text-white/60">
                You&apos;re subscribing to{" "}
                <span className="font-medium text-white">{plan.name}</span> for{" "}
                <span className="font-medium text-white">
                  KES {plan.price.toLocaleString()}
                </span>
              </p>

              <div className="mt-6">
                <label
                  htmlFor="mpesa-phone"
                  className="block text-sm font-medium text-white/60"
                >
                  M-Pesa Phone Number
                </label>
                <input
                  id="mpesa-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712345678"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {error && (
                <p className="mt-3 text-sm text-red-400">{error}</p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !phone.trim()}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Sending..." : "Pay with M-Pesa"}
                </button>
              </div>
            </motion.div>
          )}

          {step === "waiting" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-primary" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-white">
                Check Your Phone
              </h2>
              <p className="mt-2 text-white/60">
                A payment prompt has been sent to{" "}
                <span className="font-medium text-white">{phone}</span>.
                Enter your M-Pesa PIN to complete the payment.
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                KES {plan.price.toLocaleString()}
              </p>
            </motion.div>
          )}

          {step === "result" && result === "success" && (
            <motion.div
              key="result-success"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <svg
                  className="h-8 w-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-white">
                Payment Successful!
              </h2>
              {receiptNumber && (
                <p className="mt-2 text-sm text-white/50">
                  Receipt: {receiptNumber}
                </p>
              )}
              <p className="mt-2 text-white/60">
                Your {planName ?? plan.name} subscription is now active.
              </p>
              <button
                type="button"
                onClick={handleDone}
                className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/80"
              >
                Done
              </button>
            </motion.div>
          )}

          {step === "result" && result === "failed" && (
            <motion.div
              key="result-failed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <svg
                  className="h-8 w-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-white">
                Payment Failed
              </h2>
              <p className="mt-2 text-white/60">
                The payment could not be completed. Please try again.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/80"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}

          {step === "result" && result === "timeout" && (
            <motion.div
              key="result-timeout"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
                <svg
                  className="h-8 w-8 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-white">
                Still Processing
              </h2>
              <p className="mt-2 text-white/60">
                Payment is still processing. We&apos;ll update your subscription
                automatically when confirmed. Check back shortly.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-6 w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
