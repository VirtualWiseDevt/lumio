import crypto from "node:crypto";
import { UAParser } from "ua-parser-js";
import { prisma } from "../config/database.js";
import type { Session } from "../generated/prisma/client.js";

function getDeviceInfo(userAgent: string): {
  deviceName: string;
  deviceType: string;
} {
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  return {
    deviceName: `${browser.name || "Unknown"} on ${os.name || "Unknown"}`,
    deviceType: device.type || "desktop",
  };
}

export async function createSession(params: {
  userId: string;
  userAgent: string;
  ipAddress: string;
}): Promise<Session> {
  const { deviceName, deviceType } = getDeviceInfo(params.userAgent);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return prisma.session.create({
    data: {
      userId: params.userId,
      deviceName,
      deviceType,
      ipAddress: params.ipAddress,
      token: crypto.randomUUID(),
      expiresAt,
    },
  });
}

export async function enforceDeviceLimit(userId: string): Promise<{
  allowed: boolean;
  devices: Array<{ id: string; deviceName: string; lastActiveAt: Date }>;
}> {
  const activeSessions = await prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    select: { id: true, deviceName: true, lastActiveAt: true },
    orderBy: { lastActiveAt: "desc" },
  });

  if (activeSessions.length >= 2) {
    return { allowed: false, devices: activeSessions };
  }

  return { allowed: true, devices: activeSessions };
}

export async function getUserSessions(userId: string): Promise<
  Array<{
    id: string;
    deviceName: string;
    lastActiveAt: Date;
    createdAt: Date;
  }>
> {
  return prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    select: { id: true, deviceName: true, lastActiveAt: true, createdAt: true },
    orderBy: { lastActiveAt: "desc" },
  });
}

export async function deleteSession(
  sessionId: string,
  userId: string,
): Promise<void> {
  await prisma.session.delete({
    where: { id: sessionId, userId },
  });
}

export async function deleteOtherSessions(
  currentSessionId: string,
  userId: string,
): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { userId, id: { not: currentSessionId } },
  });
  return result.count;
}

export async function cleanupStaleSessions(): Promise<number> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await prisma.session.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { lastActiveAt: { lt: cutoff } }],
    },
  });
  return result.count;
}
