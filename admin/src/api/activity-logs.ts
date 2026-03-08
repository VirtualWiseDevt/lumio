import { apiClient } from "./client";

export interface ActivityLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface ActivityLogParams {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: "asc" | "desc";
}

export interface ActivityLogResponse {
  data: ActivityLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export async function listActivityLogs(
  params?: ActivityLogParams,
): Promise<ActivityLogResponse> {
  const { data } = await apiClient.get<ActivityLogResponse>(
    "/admin/activity-logs",
    { params },
  );
  return data;
}
