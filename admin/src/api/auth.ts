import { apiClient } from "./client";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  user: AdminUser;
  token: string;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/admin/login", {
    email,
    password,
  });
  return data;
}

export async function getProfile(): Promise<AdminUser> {
  const { data } = await apiClient.get<AdminUser>("/user/profile");
  return data;
}
