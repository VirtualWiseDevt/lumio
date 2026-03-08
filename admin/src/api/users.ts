import { apiClient } from "./client";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "USER" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  _count: {
    sessions: number;
    payments: number;
  };
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UserListResponse {
  data: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UserSession {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
}

export interface UserDetail extends AdminUser {
  sessions: UserSession[];
  subscription: {
    id: string;
    status: string;
    plan: { name: string };
    startDate: string;
    endDate: string;
  } | null;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: "USER" | "ADMIN";
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  role?: "USER" | "ADMIN";
  isActive?: boolean;
}

export async function listUsers(
  params?: UserListParams,
): Promise<UserListResponse> {
  const { data } = await apiClient.get<UserListResponse>("/admin/users", {
    params,
  });
  return data;
}

export async function getUser(id: string): Promise<UserDetail> {
  const { data } = await apiClient.get<UserDetail>(`/admin/users/${id}`);
  return data;
}

export async function createUser(input: CreateUserInput): Promise<AdminUser> {
  const { data } = await apiClient.post<AdminUser>("/admin/users", input);
  return data;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<AdminUser> {
  const { data } = await apiClient.put<AdminUser>(`/admin/users/${id}`, input);
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/admin/users/${id}`);
}

export async function getUserSessions(
  userId: string,
): Promise<UserSession[]> {
  const { data } = await apiClient.get<UserSession[]>(
    `/admin/users/${userId}/sessions`,
  );
  return data;
}

export async function deleteUserSession(
  userId: string,
  sessionId: string,
): Promise<void> {
  await apiClient.delete(`/admin/users/${userId}/sessions/${sessionId}`);
}

export async function exportUsers(params?: UserListParams): Promise<Blob> {
  const { data } = await apiClient.get("/admin/users/export", {
    params,
    responseType: "blob",
  });
  return data as Blob;
}
