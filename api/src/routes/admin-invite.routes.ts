import { Router, type Request, type Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import {
  createInviteCodeSchema,
  toggleInviteCodeSchema,
} from "../validators/admin-invite.validators.js";
import {
  createInviteCode,
  listInviteCodes,
  toggleInviteCode,
} from "../services/admin-invite.service.js";

export const adminInviteRouter = Router();

adminInviteRouter.use(requireAuth, requireAdmin);

/**
 * POST /api/admin/invite-codes
 * Generate a new invite code.
 */
adminInviteRouter.post("/", async (req: Request, res: Response) => {
  const body = createInviteCodeSchema.parse(req.body);
  const code = await createInviteCode(body.maxUses, req.user!.id);
  res.status(201).json(code);
});

/**
 * GET /api/admin/invite-codes
 * List all invite codes.
 */
adminInviteRouter.get("/", async (_req: Request, res: Response) => {
  const codes = await listInviteCodes();
  res.json(codes);
});

/**
 * PATCH /api/admin/invite-codes/:id
 * Toggle invite code active status.
 */
adminInviteRouter.patch("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = toggleInviteCodeSchema.parse(req.body);
  const code = await toggleInviteCode(id as string, body.isActive);
  res.json(code);
});
