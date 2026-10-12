import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { withRole } from "@/src/lib/rbac/server-guard";
import { updateSemesterSchema } from "@/src/lib/validation/admin";
import { SemesterRecord } from "../route";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/semesters/[id] - Update semester metadata, status, or dates
 */
export const PATCH = withRole(["ADMIN"], async (req, { user: actor, params }) => {
  const semesterId = params?.id as string;
  if (!semesterId) {
    return NextResponse.json(
      { success: false, data: null, error: { code: "BAD_REQUEST", message: "Semester ID is required" } },
      { status: 400 }
    );
  }

  const existingList = await prisma.$queryRawUnsafe<SemesterRecord[]>(`
    SELECT * FROM "Semester" WHERE id = '${semesterId}' LIMIT 1;
  `).catch(() => []);

  if (existingList.length === 0) {
    return NextResponse.json(
      { success: false, data: null, error: { code: "NOT_FOUND", message: "Semester not found" } },
      { status: 404 }
    );
  }

  const existing = existingList[0];
  const body = await req.json();
  const input = updateSemesterSchema.parse(body);

  // If dates are being changed, check for overlap with other semesters
  if (input.startDate || input.endDate) {
    const startIso = input.startDate
      ? new Date(input.startDate).toISOString()
      : new Date(existing.startDate).toISOString();
    const endIso = input.endDate
      ? new Date(input.endDate).toISOString()
      : new Date(existing.endDate).toISOString();

    const overlapping = await prisma.$queryRawUnsafe<SemesterRecord[]>(`
      SELECT id, name, "startDate", "endDate"
      FROM "Semester"
      WHERE "isArchived" = false
        AND id != '${semesterId}'
        AND ("startDate" <= '${endIso}'::timestamp AND "endDate" >= '${startIso}'::timestamp)
      LIMIT 1;
    `).catch(() => []);

    if (overlapping.length > 0) {
      const conflict = overlapping[0];
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "SEMESTER_OVERLAP",
            message: `Updated dates overlap with semester '${conflict.name}'.`,
          },
        },
        { status: 400 }
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    // If activating, deactivate all others
    if (input.isActive === true) {
      await tx.$executeRawUnsafe(`
        UPDATE "Semester" SET "isActive" = false WHERE "isActive" = true AND id != '${semesterId}';
      `);
    }

    const updates: string[] = [];
    if (input.name !== undefined) updates.push(`"name" = '${input.name}'`);
    if (input.startDate !== undefined) updates.push(`"startDate" = '${new Date(input.startDate).toISOString()}'::timestamp`);
    if (input.endDate !== undefined) updates.push(`"endDate" = '${new Date(input.endDate).toISOString()}'::timestamp`);
    if (input.isActive !== undefined) updates.push(`"isActive" = ${input.isActive}`);
    if (input.isArchived !== undefined) {
      updates.push(`"isArchived" = ${input.isArchived}`);
      if (input.isArchived) updates.push(`"isActive" = false`);
    }
    updates.push(`"updatedAt" = NOW()`);

    await tx.$executeRawUnsafe(`
      UPDATE "Semester" SET ${updates.join(", ")} WHERE id = '${semesterId}';
    `);

    // Audit Log
    await tx.$executeRawUnsafe(`
      INSERT INTO "AuditLog" ("id", "actorId", "actorEmail", "action", "targetId", "targetType", "beforeState", "afterState", "timestamp")
      VALUES (
        'aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}',
        '${actor.id}',
        '${actor.email}',
        'SEMESTER_UPDATED',
        '${semesterId}',
        'Semester',
        '${JSON.stringify({ name: existing.name, isActive: existing.isActive, isArchived: existing.isArchived })}',
        '${JSON.stringify(input)}',
        NOW()
      );
    `);
  });

  return NextResponse.json({
    success: true,
    message: "Semester updated successfully",
  });
});

/**
 * DELETE /api/admin/semesters/[id] - Delete semester (prevented if budgets exist)
 */
export const DELETE = withRole(["ADMIN"], async (req, { user: actor, params }) => {
  const semesterId = params?.id as string;
  if (!semesterId) {
    return NextResponse.json(
      { success: false, data: null, error: { code: "BAD_REQUEST", message: "Semester ID is required" } },
      { status: 400 }
    );
  }

  // Check for assigned budgets
  const budgetCountResult = await prisma.$queryRawUnsafe<Array<{ count: number }>>(`
    SELECT COUNT(*)::int as count FROM "DepartmentBudget" WHERE "semesterId" = '${semesterId}';
  `).catch(() => [{ count: 0 }]);

  const budgetCount = budgetCountResult[0]?.count || 0;
  if (budgetCount > 0) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: "SEMESTER_HAS_DEPENDENCIES",
          message: `Cannot delete semester with ${budgetCount} assigned department budget(s). Archive this semester instead to preserve historical records.`,
        },
      },
      { status: 400 }
    );
  }

  await prisma.$executeRawUnsafe(`
    DELETE FROM "Semester" WHERE id = '${semesterId}';
  `);

  // Record Audit Log
  await prisma.$executeRawUnsafe(`
    INSERT INTO "AuditLog" ("id", "actorId", "actorEmail", "action", "targetId", "targetType", "beforeState", "afterState", "timestamp")
    VALUES (
      'aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}',
      '${actor.id}',
      '${actor.email}',
      'SEMESTER_DELETED',
      '${semesterId}',
      'Semester',
      NULL,
      NULL,
      NOW()
    );
  `).catch(() => {});

  return NextResponse.json({
    success: true,
    message: "Semester deleted successfully",
  });
});
