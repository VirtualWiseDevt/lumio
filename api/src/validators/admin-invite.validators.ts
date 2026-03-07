import { z } from "zod";

export const createInviteCodeSchema = z.object({
  maxUses: z.number().int().min(1).max(1000).default(1),
});

export const toggleInviteCodeSchema = z.object({
  isActive: z.boolean(),
});
