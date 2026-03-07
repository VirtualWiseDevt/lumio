import type {
  MpesaClient,
  STKPushParams,
  STKPushResponse,
  STKQueryResponse,
} from "../config/mpesa.js";

// In-memory store for mock payment statuses
const mockPayments = new Map<
  string,
  { resultCode: number; resultDesc: string }
>();

export class MockMpesaClient implements MpesaClient {
  async getAccessToken(): Promise<string> {
    return "mock-access-token";
  }

  async initiateSTKPush(params: STKPushParams): Promise<STKPushResponse> {
    const checkoutRequestId = `ws_CO_MOCK_${Date.now()}`;
    const merchantRequestId = `MOCK_MER_${Date.now()}`;

    // Determine outcome: amounts ending in 01 fail, others succeed
    const willFail = params.amount % 100 === 1;

    // Store as pending initially
    mockPayments.set(checkoutRequestId, {
      resultCode: -1, // pending
      resultDesc: "Pending",
    });

    // Schedule simulated callback after 2-4 seconds
    const delay = 2000 + Math.random() * 2000;
    setTimeout(async () => {
      const resultCode = willFail ? 1032 : 0;
      const resultDesc = willFail
        ? "Request cancelled by user"
        : "The service request is processed successfully.";

      // Update in-memory store
      mockPayments.set(checkoutRequestId, { resultCode, resultDesc });

      // Call the payment callback processor directly (dynamic import to avoid circular deps)
      try {
        // Use string variable to prevent TS from resolving the module at compile time
        const modulePath = "./payment.service.js";
        const mod = await (import(modulePath) as Promise<{
          processCallback?: (data: unknown) => Promise<void>;
        }>);
        if (mod.processCallback) {
          await mod.processCallback({
            Body: {
              stkCallback: {
                MerchantRequestID: merchantRequestId,
                CheckoutRequestID: checkoutRequestId,
                ResultCode: resultCode,
                ResultDesc: resultDesc,
                CallbackMetadata: willFail
                  ? undefined
                  : {
                      Item: [
                        { Name: "Amount", Value: params.amount },
                        { Name: "MpesaReceiptNumber", Value: `MOCK${Date.now()}` },
                        { Name: "TransactionDate", Value: Date.now() },
                        { Name: "PhoneNumber", Value: params.phone },
                      ],
                    },
              },
            },
          });
        } else {
          console.log(
            `[MockMpesa] Callback for ${checkoutRequestId}: ResultCode=${resultCode} (processCallback not exported yet)`,
          );
        }
      } catch {
        // payment.service.ts may not exist yet -- log and continue
        console.log(
          `[MockMpesa] Callback for ${checkoutRequestId}: ResultCode=${resultCode} (processCallback not available yet)`,
        );
      }
    }, delay);

    return {
      MerchantRequestID: merchantRequestId,
      CheckoutRequestID: checkoutRequestId,
      ResponseCode: "0",
      ResponseDescription: "Success. Request accepted for processing",
      CustomerMessage:
        "Success. Request accepted for processing. Mock STK Push initiated.",
    };
  }

  async querySTKStatus(checkoutRequestId: string): Promise<STKQueryResponse> {
    const entry = mockPayments.get(checkoutRequestId);

    if (!entry) {
      return { ResultCode: 1037, ResultDesc: "Unknown checkout request" };
    }

    if (entry.resultCode === -1) {
      // Still pending
      return { ResultCode: 1037, ResultDesc: "The transaction is being processed" };
    }

    return { ResultCode: entry.resultCode, ResultDesc: entry.resultDesc };
  }
}
