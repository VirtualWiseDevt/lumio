import { apiClient } from "./client";

export interface BillingStatItem {
  current: number;
  previous: number;
  change: number;
}

export interface BillingStats {
  totalRevenue: BillingStatItem;
  successfulPayments: BillingStatItem;
  failedPayments: BillingStatItem;
  pendingPayments: BillingStatItem;
}

export interface AdminPayment {
  id: string;
  amount: number;
  discount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  method: string;
  phoneNumber: string | null;
  mpesaReceiptNumber: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  plan: {
    name: string;
  };
}

export interface PaymentListParams {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaymentListResponse {
  data: AdminPayment[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getBillingStats(
  periodDays?: number,
): Promise<BillingStats> {
  const { data } = await apiClient.get<BillingStats>(
    "/admin/billing/stats",
    { params: periodDays ? { periodDays } : undefined },
  );
  return data;
}

export async function listPayments(
  params?: PaymentListParams,
): Promise<PaymentListResponse> {
  const { data } = await apiClient.get<PaymentListResponse>(
    "/admin/billing/payments",
    { params },
  );
  return data;
}

export async function exportPayments(
  params?: PaymentListParams,
): Promise<Blob> {
  const { data } = await apiClient.get("/admin/billing/payments/export", {
    params,
    responseType: "blob",
  });
  return data as Blob;
}
