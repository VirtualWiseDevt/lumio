import { Router, type Request, type Response } from "express";
import { callbackSchema } from "../validators/payment.validators.js";
import { processCallback } from "../services/payment.service.js";

export const mpesaCallbackRouter = Router();

/**
 * POST /api/mpesa/callback
 * M-Pesa STK Push callback webhook.
 * NO auth -- Safaricom sends directly.
 * ALWAYS returns 200 (Safaricom expects success response).
 */
mpesaCallbackRouter.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = callbackSchema.safeParse(req.body);

    if (!parsed.success) {
      console.error(
        "[MPESA_CALLBACK] Invalid callback payload:",
        parsed.error.message,
      );
      // Still return 200 -- never reject Safaricom's callback
      res.json({ ResultCode: 0, ResultDesc: "Accepted" });
      return;
    }

    await processCallback(parsed.data);

    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("[MPESA_CALLBACK] Processing error:", error);
    // Always return 200 regardless of processing outcome
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
});
