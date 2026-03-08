import { prisma } from "../config/database.js";
import { getMpesaClient } from "../config/mpesa.js";

// ─── Sensitive Key Masking ──────────────────────────────────────────────────

const SENSITIVE_PATTERNS = ["key", "secret", "passkey"];

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_PATTERNS.some((p) => lower.includes(p));
}

function maskValue(value: unknown): unknown {
  if (typeof value === "string" && value.length > 4) {
    return "****" + value.slice(-4);
  }
  return value;
}

// ─── Get Setting ────────────────────────────────────────────────────────────

export async function getSetting<T>(
  key: string,
  defaultValue: T,
): Promise<T> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
  });

  if (!setting) return defaultValue;

  const raw = setting.value as unknown;
  if (isSensitiveKey(key)) {
    return maskValue(raw) as T;
  }
  return raw as T;
}

// ─── Get Settings (batch) ───────────────────────────────────────────────────

export async function getSettings(
  keys?: string[],
): Promise<Record<string, unknown>> {
  const where = keys && keys.length > 0 ? { key: { in: keys } } : {};

  const settings = await prisma.systemSetting.findMany({ where });

  const result: Record<string, unknown> = {};
  for (const s of settings) {
    result[s.key] = isSensitiveKey(s.key)
      ? maskValue(s.value as unknown)
      : (s.value as unknown);
  }

  return result;
}

// ─── Set Setting ────────────────────────────────────────────────────────────

export async function setSetting(
  key: string,
  value: unknown,
  adminId: string,
): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    create: {
      key,
      value: value as never,
      updatedBy: adminId,
    },
    update: {
      value: value as never,
      updatedBy: adminId,
    },
  });
}

// ─── Set Settings (batch) ───────────────────────────────────────────────────

export async function setSettings(
  settings: Record<string, unknown>,
  adminId: string,
): Promise<void> {
  await prisma.$transaction(
    Object.entries(settings).map(([key, value]) =>
      prisma.systemSetting.upsert({
        where: { key },
        create: {
          key,
          value: value as never,
          updatedBy: adminId,
        },
        update: {
          value: value as never,
          updatedBy: adminId,
        },
      }),
    ),
  );
}

// ─── Test M-Pesa Connection ─────────────────────────────────────────────────

export async function testMpesaConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const mpesa = await getMpesaClient();
    // Attempt to get OAuth token -- this validates credentials
    await mpesa.getAccessToken();
    return { success: true, message: "M-Pesa connection successful" };
  } catch (error) {
    // In mock/sandbox environment, treat as success
    if (process.env.MPESA_ENVIRONMENT === "mock") {
      return { success: true, message: "M-Pesa mock environment active" };
    }
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "M-Pesa connection failed",
    };
  }
}
