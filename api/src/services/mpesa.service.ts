import {
  DARAJA_BASE_URL,
  mpesaConfig,
} from "../config/mpesa.js";
import type {
  MpesaClient,
  STKPushParams,
  STKPushResponse,
  STKQueryResponse,
} from "../config/mpesa.js";

// ─── Token Cache ─────────────────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiry = 0;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate timestamp in YYYYMMDDHHMMSS format in EAT (UTC+3) */
function generateTimestamp(): string {
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/** Generate Lipa Na M-Pesa password: Base64(shortcode + passkey + timestamp) */
function generatePassword(timestamp: string): string {
  return Buffer.from(
    `${mpesaConfig.shortcode}${mpesaConfig.passkey}${timestamp}`,
  ).toString("base64");
}

// ─── Daraja Client ───────────────────────────────────────────────────────────

export class DarajaMpesaClient implements MpesaClient {
  private baseUrl: string;

  constructor() {
    if (!DARAJA_BASE_URL) {
      throw new Error(
        "DarajaMpesaClient requires sandbox or production environment",
      );
    }
    this.baseUrl = DARAJA_BASE_URL;
  }

  async getAccessToken(): Promise<string> {
    // Return cached token if still valid (5-minute buffer)
    const now = Date.now();
    if (cachedToken && tokenExpiry > now + 5 * 60 * 1000) {
      return cachedToken;
    }

    const credentials = Buffer.from(
      `${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`,
    ).toString("base64");

    const response = await fetch(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Daraja OAuth failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: string;
    };

    cachedToken = data.access_token;
    tokenExpiry = now + parseInt(data.expires_in, 10) * 1000;

    return cachedToken;
  }

  async initiateSTKPush(params: STKPushParams): Promise<STKPushResponse> {
    const token = await this.getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

    const response = await fetch(
      `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: mpesaConfig.shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: params.amount,
          PartyA: params.phone,
          PartyB: mpesaConfig.shortcode,
          PhoneNumber: params.phone,
          CallBackURL: mpesaConfig.callbackUrl,
          AccountReference: params.accountRef,
          TransactionDesc: `Lumio ${params.accountRef}`,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`STK Push failed (${response.status}): ${text}`);
    }

    return (await response.json()) as STKPushResponse;
  }

  async querySTKStatus(checkoutRequestId: string): Promise<STKQueryResponse> {
    const token = await this.getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

    const response = await fetch(
      `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: mpesaConfig.shortcode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`STK Query failed (${response.status}): ${text}`);
    }

    return (await response.json()) as STKQueryResponse;
  }
}

export type { MpesaClient };
