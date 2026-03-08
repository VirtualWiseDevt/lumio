import { prisma } from "../config/database.js";

// ─── Billing Stats ──────────────────────────────────────────────────────────

interface PeriodStat {
  current: number;
  previous: number;
  change: number;
}

interface BillingStats {
  totalRevenue: PeriodStat;
  successfulPayments: PeriodStat;
  failedPayments: PeriodStat;
  pendingPayments: PeriodStat;
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getBillingStats(periodDays: number): Promise<BillingStats> {
  const now = new Date();
  const currentStart = new Date(now.getTime() - periodDays * 86_400_000);
  const previousStart = new Date(
    currentStart.getTime() - periodDays * 86_400_000,
  );

  const [
    curRevenue,
    prevRevenue,
    curSuccess,
    prevSuccess,
    curFailed,
    prevFailed,
    curPending,
    prevPending,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "SUCCESS", createdAt: { gte: currentStart, lte: now } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: "SUCCESS",
        createdAt: { gte: previousStart, lt: currentStart },
      },
      _sum: { amount: true },
    }),
    prisma.payment.count({
      where: { status: "SUCCESS", createdAt: { gte: currentStart, lte: now } },
    }),
    prisma.payment.count({
      where: {
        status: "SUCCESS",
        createdAt: { gte: previousStart, lt: currentStart },
      },
    }),
    prisma.payment.count({
      where: { status: "FAILED", createdAt: { gte: currentStart, lte: now } },
    }),
    prisma.payment.count({
      where: {
        status: "FAILED",
        createdAt: { gte: previousStart, lt: currentStart },
      },
    }),
    prisma.payment.count({
      where: { status: "PENDING", createdAt: { gte: currentStart, lte: now } },
    }),
    prisma.payment.count({
      where: {
        status: "PENDING",
        createdAt: { gte: previousStart, lt: currentStart },
      },
    }),
  ]);

  const revCur = curRevenue._sum.amount ?? 0;
  const revPrev = prevRevenue._sum.amount ?? 0;

  return {
    totalRevenue: {
      current: revCur,
      previous: revPrev,
      change: calcChange(revCur, revPrev),
    },
    successfulPayments: {
      current: curSuccess,
      previous: prevSuccess,
      change: calcChange(curSuccess, prevSuccess),
    },
    failedPayments: {
      current: curFailed,
      previous: prevFailed,
      change: calcChange(curFailed, prevFailed),
    },
    pendingPayments: {
      current: curPending,
      previous: prevPending,
      change: calcChange(curPending, prevPending),
    },
  };
}

// ─── List Payments ──────────────────────────────────────────────────────────

interface ListPaymentsParams {
  status?: string;
  userId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export async function listPayments(params: ListPaymentsParams) {
  const { status, userId, search, startDate, endDate, page, limit, sortBy, sortOrder } =
    params;

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (userId) where.userId = userId;

  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;
    where.createdAt = dateFilter;
  }

  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { name: true, email: true } },
        plan: { select: { name: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Export Payments ────────────────────────────────────────────────────────

export async function exportPayments(
  params: Omit<ListPaymentsParams, "page" | "limit">,
) {
  const { status, userId, search, startDate, endDate, sortBy, sortOrder } = params;

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (userId) where.userId = userId;

  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;
    where.createdAt = dateFilter;
  }

  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  return prisma.payment.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    take: 10000,
    include: {
      user: { select: { name: true, email: true } },
      plan: { select: { name: true } },
    },
  });
}
