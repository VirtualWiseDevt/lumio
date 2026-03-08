import { api } from "./client";
import type {
  RegisterInput,
  LoginInput,
  AuthResponse,
  DeviceLimitResponse,
  ReferralValidation,
} from "@/types/auth";

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", input);
  localStorage.setItem("token", data.token);
  return data;
}

export async function login(
  input: LoginInput
): Promise<AuthResponse | DeviceLimitResponse> {
  const { data } = await api.post<AuthResponse | DeviceLimitResponse>(
    "/auth/login",
    input
  );
  if (!("deviceLimitReached" in data)) {
    localStorage.setItem("token", data.token);
  }
  return data;
}

export async function validateReferralCode(
  code: string
): Promise<ReferralValidation> {
  try {
    const { data } = await api.get<ReferralValidation>(
      `/referrals/validate/${encodeURIComponent(code)}`
    );
    return data;
  } catch {
    return { valid: false };
  }
}

export async function forceLogin(
  input: LoginInput & { sessionId: string }
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/force-login", input);
  localStorage.setItem("token", data.token);
  return data;
}
