import { prisma } from "../config/database.js";

// ─── Dashboard Stats ────────────────────────────────────────────────────────

interface PeriodStat {
  current: number;
  previous: number;
  change: number;
}

interface DashboardStats {
  revenue: PeriodStat;
  activeUsers: PeriodStat;
  totalContent: PeriodStat;
  failedPayments: PeriodStat;
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getDashboardStats(
  periodDays: number,
): Promise<DashboardStats> {
  const now = new Date();
  const currentStart = new Date(now.getTime() - periodDays * 86_400_000);
  const previousStart = new Date(
    currentStart.getTime() - periodDays * 86_400_000,
  );

  const [
    currentRevenue,
    previousRevenue,
    currentActiveUsers,
    previousActiveUsers,
    currentContent,
    previousContent,
    currentFailed,
    previousFailed,
  ] = await Promise.all([
    // Revenue (current period)
    prisma.payment.aggregate({
      where: { status: "SUCCESS", createdAt: { gte: currentStart, lte: now } },
      _sum: { amount: true },
    }),
    // Revenue (previous period)
    prisma.payment.aggregate({
      where: {
        status: "SUCCESS",
        createdAt: { gte: previousStart, lt: currentStart },
      },
      _sum: { amount: true },
    }),
    // Active users (current period -- users with sessions active in period)
    prisma.user.count({
      where: {
        sessions: { some: { lastActiveAt: { gte: currentStart } } },
      },
    }),
    // Active users (previous period)
    prisma.user.count({
      where: {
        sessions: {
          some: {
            lastActiveAt: { gte: previousStart, lt: currentStart },
          },
        },
      },
    }),
    // Total content (current)
    prisma.content.count({
      where: { createdAt: { lte: now } },
    }),
    // Total content (previous -- count as of start of current period)
    prisma.content.count({
      where: { createdAt: { lt: currentStart } },
    }),
    // Failed payments (current)
    prisma.payment.count({
      where: { status: "FAILED", createdAt: { gte: currentStart, lte: now } },
    }),
    // Failed payments (previous)
    prisma.payment.count({
      where: {
        status: "FAILED",
        createdAt: { gte: previousStart, lt: currentStart },
      },
    }),
  ]);

  const revCurrent = currentRevenue._sum.amount ?? 0;
  const revPrevious = previousRevenue._sum.amount ?? 0;

  return {
    revenue: {
      current: revCurrent,
      previous: revPrevious,
      change: calcChange(revCurrent, revPrevious),
    },
    activeUsers: {
      current: currentActiveUsers,
      previous: previousActiveUsers,
      change: calcChange(currentActiveUsers, previousActiveUsers),
    },
    totalContent: {
      current: currentContent,
      previous: previousContent,
      change: calcChange(currentContent, previousContent),
    },
    failedPayments: {
      current: currentFailed,
      previous: previousFailed,
      change: calcChange(currentFailed, previousFailed),
    },
  };
}

// ─── Revenue Chart ──────────────────────────────────────────────────────────

interface RevenueChartPoint {
  month: string;
  revenue: number;
}

export async function getRevenueChart(
  months: number,
): Promise<RevenueChartPoint[]> {
  const now = new Date();
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - months + 1,
    1,
  );

  const payments = await prisma.payment.findMany({
    where: {
      status: "SUCCESS",
      createdAt: { gte: startDate },
    },
    select: {
      amount: true,
      createdAt: true,
    },
  });

  // Build month buckets
  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
  }

  for (const p of payments) {
    const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (buckets.has(key)) {
      buckets.set(key, buckets.get(key)! + p.amount);
    }
  }

  return Array.from(buckets.entries()).map(([month, revenue]) => ({
    month,
    revenue,
  }));
}

// ─── Content Breakdown ──────────────────────────────────────────────────────

interface ContentBreakdownItem {
  type: string;
  count: number;
}

export async function getContentBreakdown(): Promise<ContentBreakdownItem[]> {
  const groups = await prisma.content.groupBy({
    by: ["type"],
    _count: true,
  });

  return groups.map((g) => ({
    type: g.type,
    count: g._count,
  }));
}

// ─── Recent Activity ────────────────────────────────────────────────────────

interface RecentActivityParams {
  period?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

export async function getRecentActivity(params: RecentActivityParams) {
  const { period, startDate, endDate, page, limit } = params;

  const where: Record<string, unknown> = {};

  if (period && period !== "all") {
    const now = new Date();
    let from: Date;

    if (period === "custom" && startDate && endDate) {
      where.createdAt = { gte: startDate, lte: endDate };
    } else {
      const daysMap: Record<string, number> = {
        week: 7,
        month: 30,
        quarter: 90,
      };
      const days = daysMap[period] ?? 30;
      from = new Date(now.getTime() - days * 86_400_000);
      where.createdAt = { gte: from, lte: now };
    }
  }

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
