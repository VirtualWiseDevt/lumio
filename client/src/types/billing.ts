export interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  isActive: boolean;
}

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED";

export interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  mpesaReceiptNumber: string | null;
  phoneNumber: string | null;
  createdAt: string;
  plan: { name: string };
}

export interface PaymentHistoryResponse {
  payments: Payment[];
  total: number;
  page: number;
  totalPages: number;
}

export interface InitiatePaymentResponse {
  paymentId: string;
  checkoutRequestId: string;
  isExisting: boolean;
}

export interface PaymentStatusResponse {
  status: PaymentStatus;
  mpesaReceiptNumber?: string;
  planName?: string;
}

export interface SubscriptionInfo {
  id: string;
  planName: string;
  status: string;
  expiresAt: string;
  autoRenew: boolean;
}
