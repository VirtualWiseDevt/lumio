import { api } from "./client";
import type {
  UserProfile,
  UserSubscription,
  DeviceSession,
} from "@/types/player";

export async function getUserProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>("/user/profile");
  return data;
}

export async function updateUserProfile(data: {
  name?: string;
  phone?: string;
}): Promise<UserProfile> {
  const { data: profile } = await api.patch<UserProfile>(
    "/user/profile",
    data
  );
  return profile;
}

export async function updatePreferences(data: {
  newsletter: boolean;
}): Promise<void> {
  await api.patch("/user/preferences", data);
}

export async function getUserSubscription(): Promise<UserSubscription> {
  const { data } = await api.get<UserSubscription>("/user/subscription");
  return data;
}

export async function getUserSessions(): Promise<DeviceSession[]> {
  const { data } = await api.get<DeviceSession[]>("/sessions");
  return data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await api.delete(`/sessions/${sessionId}`);
}
