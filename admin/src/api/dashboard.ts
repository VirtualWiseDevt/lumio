import { apiClient } from "./client";

export interface StatItem {
  current: number;
  previous: number;
  change: number;
}

export interface DashboardStats {
  revenue: StatItem;
  activeUsers: StatItem;
  totalContent: StatItem;
  failedPayments: StatItem;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
}

export interface ContentBreakdown {
  type: string;
  count: number;
}

export interface ActivityFeedItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

export interface ActivityFeedResponse {
  data: ActivityFeedItem[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getDashboardStats(
  periodDays?: number,
): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>(
    "/admin/dashboard/stats",
    { params: periodDays ? { periodDays } : undefined },
  );
  return data;
}

export async function getRevenueChart(
  months?: number,
): Promise<RevenueChartData[]> {
  const { data } = await apiClient.get<RevenueChartData[]>(
    "/admin/dashboard/revenue-chart",
    { params: months ? { months } : undefined },
  );
  return data;
}

export async function getContentBreakdown(): Promise<ContentBreakdown[]> {
  const { data } = await apiClient.get<ContentBreakdown[]>(
    "/admin/dashboard/content-breakdown",
  );
  return data;
}

export interface ActivityFeedParams {
  page?: number;
  limit?: number;
}

export async function getRecentActivity(
  params?: ActivityFeedParams,
): Promise<ActivityFeedResponse> {
  const { data } = await apiClient.get<ActivityFeedResponse>(
    "/admin/dashboard/activity",
    { params },
  );
  return data;
}
