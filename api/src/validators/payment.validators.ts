import { z } from "zod";

// ─── Initiate Payment ────────────────────────────────────────────────────────

export const initiatePaymentSchema = z.object({
  planId: z.string().uuid(),
  phone: z.string().min(9).max(15),
  couponCode: z.string().min(1).max(50).optional(),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

// ─── Daraja Callback ─────────────────────────────────────────────────────────

export const callbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(
            z.object({
              Name: z.string(),
              Value: z.union([z.string(), z.number()]).optional(),
            }),
          ),
        })
        .optional(),
    }),
  }),
});

export type CallbackInput = z.infer<typeof callbackSchema>;
