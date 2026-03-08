import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/database.js";

// ─── Log Activity ───────────────────────────────────────────────────────────

interface LogActivityParams {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        details: (params.details as Prisma.InputJsonValue) ?? undefined,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (error) {
    // Fire-and-forget safe -- log to console but do not throw
    console.error("[ACTIVITY_LOG] Failed to log activity:", error);
  }
}

// ─── List Activity Logs ─────────────────────────────────────────────────────

interface ListActivityLogsParams {
  action?: string;
  entityType?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export async function listActivityLogs(params: ListActivityLogsParams) {
  const {
    action,
    entityType,
    userId,
    startDate,
    endDate,
    page,
    limit,
    sortBy,
    sortOrder,
  } = params;

  const where: Record<string, unknown> = {};

  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (userId) where.userId = userId;

  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;
    where.createdAt = dateFilter;
  }

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
