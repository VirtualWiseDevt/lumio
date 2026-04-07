export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  referralCode?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    referralCode?: string;
  };
  token: string;
}

export interface DeviceLimitResponse {
  deviceLimitReached: true;
  devices: Array<{
    id: string;
    deviceName: string;
    deviceType: string;
    lastActiveAt: string;
  }>;
}

export interface ReferralValidation {
  valid: boolean;
  referrerName?: string;
}
