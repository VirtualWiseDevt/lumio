import { apiClient } from "./client";

export interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  remainingUses: number;
  isActive: boolean;
  createdAt: string;
}

export async function createInviteCode(maxUses: number): Promise<InviteCode> {
  const { data } = await apiClient.post<InviteCode>(
    "/admin/invite-codes",
    { maxUses },
  );
  return data;
}

export async function listInviteCodes(): Promise<InviteCode[]> {
  const { data } = await apiClient.get<InviteCode[]>("/admin/invite-codes");
  return data;
}

export async function toggleInviteCode(
  id: string,
  isActive: boolean,
): Promise<InviteCode> {
  const { data } = await apiClient.patch<InviteCode>(
    `/admin/invite-codes/${id}`,
    { isActive },
  );
  return data;
}
