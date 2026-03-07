import { Router } from "express";
import { adminLoginSchema } from "../validators/admin.validators.js";
import { adminLogin } from "../services/admin.service.js";
import { AuthError } from "../services/auth.service.js";

export const adminRouter = Router();

// POST /login (public -- admin login endpoint)
adminRouter.post("/login", async (req, res) => {
  try {
    const result = adminLoginSchema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json({
        error: {
          message: result.error.errors[0].message,
          code: "VALIDATION_ERROR",
        },
      });
      return;
    }

    const loginResult = await adminLogin(result.data, {
      userAgent: req.headers["user-agent"] || "",
      ipAddress: req.ip || "unknown",
    });

    res.status(200).json({
      user: loginResult.user,
      token: loginResult.token,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      res
        .status(error.statusCode)
        .json({ error: { message: error.message, code: error.code } });
      return;
    }
    throw error;
  }
});
