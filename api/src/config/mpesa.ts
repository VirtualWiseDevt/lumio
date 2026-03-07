import { env } from "./env.js";

// ─── Config ──────────────────────────────────────────────────────────────────

export const mpesaConfig = {
  environment: env.MPESA_ENVIRONMENT,
  consumerKey: env.MPESA_CONSUMER_KEY,
  consumerSecret: env.MPESA_CONSUMER_SECRET,
  shortcode: env.MPESA_SHORTCODE,
  passkey: env.MPESA_PASSKEY,
  callbackUrl: env.MPESA_CALLBACK_URL,
} as const;

export const DARAJA_BASE_URL: string | null =
  mpesaConfig.environment === "sandbox"
    ? "https://sandbox.safaricom.co.ke"
    : mpesaConfig.environment === "production"
      ? "https://api.safaricom.co.ke"
      : null; // mock mode

// ─── Types ───────────────────────────────────────────────────────────────────

export interface STKPushParams {
  phone: string; // 254XXXXXXXXX format
  amount: number;
  accountRef: string;
}

export interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface STKQueryResponse {
  ResultCode: number;
  ResultDesc: string;
}

export interface MpesaClient {
  getAccessToken(): Promise<string>;
  initiateSTKPush(params: STKPushParams): Promise<STKPushResponse>;
  querySTKStatus(checkoutRequestId: string): Promise<STKQueryResponse>;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export async function getMpesaClient(): Promise<MpesaClient> {
  if (mpesaConfig.environment === "mock") {
    const { MockMpesaClient } = await import(
      "../services/mpesa-mock.service.js"
    );
    return new MockMpesaClient();
  }

  const { DarajaMpesaClient } = await import(
    "../services/mpesa.service.js"
  );
  return new DarajaMpesaClient();
}
