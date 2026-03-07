import crypto from "node:crypto";
import { prisma } from "../config/database.js";

/**
 * Generate a new admin invite code.
 */
export async function createInviteCode(maxUses: number, createdBy: string) {
  const code = crypto.randomBytes(4).toString("hex").toUpperCase();

  return prisma.adminInviteCode.create({
    data: {
      code,
      maxUses,
      createdBy,
    },
  });
}

/**
 * List all admin invite codes with computed remainingUses.
 */
export async function listInviteCodes() {
  const codes = await prisma.adminInviteCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return codes.map((c) => ({
    ...c,
    remainingUses: c.maxUses - c.usedCount,
  }));
}

/**
 * Toggle an invite code's active status.
 */
export async function toggleInviteCode(id: string, isActive: boolean) {
  return prisma.adminInviteCode.update({
    where: { id },
    data: { isActive },
  });
}
