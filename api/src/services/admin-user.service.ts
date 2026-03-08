import * as argon2 from "argon2";
import { prisma } from "../config/database.js";

// ─── List Users ─────────────────────────────────────────────────────────────

interface ListUsersParams {
  search?: string;
  status?: "active" | "inactive";
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
}

export async function listUsers(params: ListUsersParams) {
  const { search, status, sortBy, sortOrder, page, limit } = params;

  const where: Record<string, unknown> = {};

  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { sessions: true, payments: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Get User ───────────────────────────────────────────────────────────────

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      newsletter: true,
      referralCode: true,
      referralCreditBalance: true,
      createdAt: true,
      updatedAt: true,
      sessions: {
        where: { expiresAt: { gt: new Date() } },
        select: {
          id: true,
          deviceName: true,
          deviceType: true,
          ipAddress: true,
          lastActiveAt: true,
          createdAt: true,
        },
        orderBy: { lastActiveAt: "desc" },
      },
      _count: { select: { payments: true, subscriptions: true } },
    },
  });

  if (!user) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  return user;
}

// ─── Create User ────────────────────────────────────────────────────────────

interface CreateUserData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: "USER" | "ADMIN";
}

export async function createUser(data: CreateUserData) {
  const passwordHash = await argon2.hash(data.password);

  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        passwordHash,
        role: data.role ?? "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as unknown as Record<string, unknown>).code === "P2002"
    ) {
      const err = new Error("Email or phone already in use") as Error & {
        statusCode: number;
      };
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }
}

// ─── Update User ────────────────────────────────────────────────────────────

interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: "USER" | "ADMIN";
  isActive?: boolean;
}

export async function updateUser(id: string, data: UpdateUserData) {
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email.toLowerCase();
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  if (data.password) {
    updateData.passwordHash = await argon2.hash(data.password);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as unknown as Record<string, unknown>).code === "P2002"
    ) {
      const err = new Error("Email or phone already in use") as Error & {
        statusCode: number;
      };
      err.statusCode = 409;
      throw err;
    }
    if (
      error instanceof Error &&
      "code" in error &&
      (error as unknown as Record<string, unknown>).code === "P2025"
    ) {
      const err = new Error("User not found") as Error & {
        statusCode: number;
      };
      err.statusCode = 404;
      throw err;
    }
    throw error;
  }
}

// ─── Delete User (soft delete) ──────────────────────────────────────────────

export async function deleteUser(id: string) {
  try {
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as unknown as Record<string, unknown>).code === "P2025"
    ) {
      const err = new Error("User not found") as Error & {
        statusCode: number;
      };
      err.statusCode = 404;
      throw err;
    }
    throw error;
  }
}

// ─── User Sessions ──────────────────────────────────────────────────────────

export async function listUserSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      deviceName: true,
      deviceType: true,
      ipAddress: true,
      lastActiveAt: true,
      createdAt: true,
    },
    orderBy: { lastActiveAt: "desc" },
  });
}

export async function deleteUserSession(userId: string, sessionId: string) {
  try {
    await prisma.session.delete({
      where: { id: sessionId, userId },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as unknown as Record<string, unknown>).code === "P2025"
    ) {
      const err = new Error("Session not found") as Error & {
        statusCode: number;
      };
      err.statusCode = 404;
      throw err;
    }
    throw error;
  }
}

// ─── Export Users ───────────────────────────────────────────────────────────

export async function exportUsers(params: Omit<ListUsersParams, "page" | "limit">) {
  const { search, status, sortBy, sortOrder } = params;

  const where: Record<string, unknown> = {};

  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  return prisma.user.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    take: 10000,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { sessions: true, payments: true } },
    },
  });
}
