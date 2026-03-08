import { apiClient } from "./client";

export type PlatformSettings = Record<string, unknown>;

export interface MpesaTestResult {
  success: boolean;
  message: string;
}

export async function getSettings(
  keys?: string[],
): Promise<PlatformSettings> {
  const { data } = await apiClient.get<PlatformSettings>(
    "/admin/settings",
    { params: keys ? { keys: keys.join(",") } : undefined },
  );
  return data;
}

export async function updateSettings(
  settings: PlatformSettings,
): Promise<PlatformSettings> {
  const { data } = await apiClient.put<PlatformSettings>(
    "/admin/settings",
    settings,
  );
  return data;
}

export async function testMpesaConnection(): Promise<MpesaTestResult> {
  const { data } = await apiClient.post<MpesaTestResult>(
    "/admin/settings/mpesa/test",
  );
  return data;
}
