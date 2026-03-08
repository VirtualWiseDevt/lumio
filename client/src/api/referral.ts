import { api } from "./client";

export interface ReferralCodeResponse {
  referralCode: string;
  referralUrl: string;
}

export interface ReferralStats {
  friendsJoined: number;
  creditsEarned: number;
  currentBalance: number;
}

export async function getMyReferralCode(): Promise<ReferralCodeResponse> {
  const { data } = await api.get<ReferralCodeResponse>("/referrals/my-code");
  return data;
}

export async function getReferralStats(): Promise<ReferralStats> {
  const { data } = await api.get<ReferralStats>("/referrals/stats");
  return data;
}
