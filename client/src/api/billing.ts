import { api } from "./client";
import type {
  Plan,
  InitiatePaymentResponse,
  PaymentStatusResponse,
  PaymentHistoryResponse,
  SubscriptionInfo,
  CouponValidation,
} from "@/types/billing";

export async function getPlans(): Promise<Plan[]> {
  const { data } = await api.get<{ plans: Plan[] }>("/plans");
  return data.plans;
}

export async function initiatePayment(
  planId: string,
  phone: string,
  couponCode?: string
): Promise<InitiatePaymentResponse> {
  const { data } = await api.post<InitiatePaymentResponse>(
    "/payments/initiate",
    { planId, phone, couponCode }
  );
  return data;
}

export async function getPaymentStatus(
  paymentId: string
): Promise<PaymentStatusResponse> {
  const { data } = await api.get<PaymentStatusResponse>(
    `/payments/${paymentId}/status`
  );
  return data;
}

export async function pollPaymentStatus(
  paymentId: string,
  options?: { interval?: number; maxAttempts?: number }
): Promise<{
  success: boolean;
  timeout: boolean;
  data?: PaymentStatusResponse;
}> {
  const interval = options?.interval ?? 3000;
  const maxAttempts = options?.maxAttempts ?? 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getPaymentStatus(paymentId);

    if (status.status === "SUCCESS") {
      return { success: true, timeout: false, data: status };
    }

    if (status.status === "FAILED" || status.status === "EXPIRED") {
      return { success: false, timeout: false, data: status };
    }

    // Still PENDING -- wait before next attempt
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  return { success: false, timeout: true };
}

export async function getPaymentHistory(
  page?: number,
  limit?: number
): Promise<PaymentHistoryResponse> {
  const { data } = await api.get<PaymentHistoryResponse>(
    "/payments/history",
    { params: { page, limit } }
  );
  return data;
}

export async function validateCoupon(code: string): Promise<CouponValidation> {
  try {
    const { data } = await api.post<CouponValidation>("/coupons/validate", {
      code,
    });
    return data;
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "response" in err &&
      err.response &&
      typeof err.response === "object" &&
      "data" in err.response &&
      err.response.data &&
      typeof err.response.data === "object" &&
      "message" in err.response.data
    ) {
      return {
        valid: false,
        message: (err.response.data as { message: string }).message,
      };
    }
    return { valid: false, message: "Failed to validate coupon" };
  }
}

export async function getSubscription(): Promise<SubscriptionInfo | null> {
  const { data } = await api.get<SubscriptionInfo | null>(
    "/user/subscription"
  );
  return data;
}
