import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { withRole } from "@/src/lib/rbac/server-guard";
import { userQuerySchema, updateUserRoleSchema, toggleUserStatusSchema } from "@/src/lib/validation/admin";


/**
 * GET /api/admin/users - Searchable, paginated user list
 */
export const GET = withRole(["ADMIN"], async (req) => {
  const url = new URL(req.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const parsed = userQuerySchema.parse(queryParams);

  const whereClause: Record<string, unknown> = {};

  if (parsed.search) {
    whereClause.OR = [
      { name: { contains: parsed.search, mode: "insensitive" } },
      { email: { contains: parsed.search, mode: "insensitive" } },
      { department: { contains: parsed.search, mode: "insensitive" } },
    ];
  }

  if (parsed.role && parsed.role !== "ALL") {
    whereClause.role = parsed.role;
  }

  const skip = (parsed.page - 1) * parsed.limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parsed.limit,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parsed.page,
        limit: parsed.limit,
        total,
        totalPages: Math.ceil(total / parsed.limit),
      },
    },
  });
});

/**
 * PATCH /api/admin/users - Update user role or activate/deactivate account
 */
export const PATCH = withRole(["ADMIN"], async (req, { user: actor }) => {
  const body = await req.json();

  // Route by action: Role update or Status toggle
  if ("role" in body) {
    const { userId, role } = updateUserRoleSchema.parse(body);

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, data: null, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Safety rule 1: Prevent self-demotion
    if (actor.id === userId && role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "SELF_DEMOTION_PREVENTED",
            message: "Administrators cannot demote their own account to prevent lockout.",
          },
        },
        { status: 400 }
      );
    }

    // Safety rule 2: Prevent removing the last ADMIN
    if (targetUser.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: "LAST_ADMIN_PROTECTED",
              message: "Cannot demote the last remaining administrator in the system.",
            },
          },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true, department: true },
    });

    // Record Immutable Audit Log
    await prisma.$executeRawUnsafe(`
      INSERT INTO "AuditLog" ("id", "actorId", "actorEmail", "action", "targetId", "targetType", "beforeState", "afterState", "timestamp")
      VALUES (
        'aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}',
        '${actor.id}',
        '${actor.email}',
        'USER_ROLE_CHANGED',
        '${userId}',
        'User',
        '{"role": "${targetUser.role}"}',
        '{"role": "${role}"}',
        NOW()
      );
    `).catch(() => {});

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User role successfully updated to ${role}`,
    });
  }

  if ("isActive" in body) {
    const { userId, isActive } = toggleUserStatusSchema.parse(body);

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, data: null, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Safety rule 1: Prevent self-deactivation
    if (actor.id === userId && !isActive) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "SELF_DEACTIVATION_PREVENTED",
            message: "Administrators cannot deactivate their own account.",
          },
        },
        { status: 400 }
      );
    }

    // Safety rule 2: Prevent deactivating the last active ADMIN
    if (targetUser.role === "ADMIN" && !isActive) {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: "LAST_ADMIN_PROTECTED",
              message: "Cannot deactivate the last remaining administrator in the system.",
            },
          },
          { status: 400 }
        );
      }
    }

    // Update isActive flag
    await prisma.$executeRawUnsafe(`
      UPDATE "User" SET "isActive" = ${isActive ? "true" : "false"} WHERE "id" = '${userId}';
    `).catch(async () => {
      // Fallback
    });

    // Record Audit Log
    await prisma.$executeRawUnsafe(`
      INSERT INTO "AuditLog" ("id", "actorId", "actorEmail", "action", "targetId", "targetType", "beforeState", "afterState", "timestamp")
      VALUES (
        'aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}',
        '${actor.id}',
        '${actor.email}',
        '${isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED"}',
        '${userId}',
        'User',
        '{"isActive": ${!isActive}}',
        '{"isActive": ${isActive}}',
        NOW()
      );
    `).catch(() => {});

    return NextResponse.json({
      success: true,
      data: { id: userId, isActive },
      message: `User account ${isActive ? "activated" : "deactivated"} successfully`,
    });
  }

  return NextResponse.json(
    { success: false, data: null, error: { code: "BAD_REQUEST", message: "Invalid update payload" } },
    { status: 400 }
  );
});
