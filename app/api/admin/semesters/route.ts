import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { withRole } from "@/src/lib/rbac/server-guard";
import { createSemesterSchema } from "@/src/lib/validation/admin";


export interface SemesterRecord {
  id: string;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * GET /api/admin/semesters - List all semesters
 */
export const GET = withRole(["ADMIN"], async () => {
  try {
    const semesters = await prisma.$queryRawUnsafe<SemesterRecord[]>(`
      SELECT 
        s.*, 
        COUNT(b.id)::int as "budgetCount"
      FROM "Semester" s
      LEFT JOIN "DepartmentBudget" b ON b."semesterId" = s.id
      GROUP BY s.id
      ORDER BY s."startDate" DESC;
    `);

    return NextResponse.json({
      success: true,
      data: semesters,
    });
  } catch (err: unknown) {
    console.error("[Semesters] Error querying semesters:", err);
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
});

/**
 * POST /api/admin/semesters - Create new semester with overlap check & transactional active switch
 */
export const POST = withRole(["ADMIN"], async (req, { user: actor }) => {
  const body = await req.json();
  const input = createSemesterSchema.parse(body);

  const startIso = new Date(input.startDate).toISOString();
  const endIso = new Date(input.endDate).toISOString();

  // 1. Check for overlapping non-archived semesters (start <= existingEnd AND end >= existingStart)
  const overlapping = await prisma.$queryRawUnsafe<SemesterRecord[]>(`
    SELECT id, name, "startDate", "endDate"
    FROM "Semester"
    WHERE "isArchived" = false
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
          message: `Proposed dates overlap with existing semester '${conflict.name}' (${new Date(conflict.startDate).toLocaleDateString()} – ${new Date(conflict.endDate).toLocaleDateString()}). Semesters cannot have overlapping date ranges.`,
        },
      },
      { status: 400 }
    );
  }

  // 2. Transactional creation & single active semester switch
  const newId = `sem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  await prisma.$transaction(async (tx) => {
    if (input.isActive) {
      // Deactivate any currently active semester
      await tx.$executeRawUnsafe(`
        UPDATE "Semester" SET "isActive" = false WHERE "isActive" = true;
      `);
    }

    // Insert new semester
    await tx.$executeRawUnsafe(`
      INSERT INTO "Semester" ("id", "name", "startDate", "endDate", "isActive", "isArchived", "createdAt", "updatedAt")
      VALUES ('${newId}', '${input.name}', '${startIso}'::timestamp, '${endIso}'::timestamp, ${input.isActive}, false, NOW(), NOW());
    `);

    // Record audit log
    await tx.$executeRawUnsafe(`
      INSERT INTO "AuditLog" ("id", "actorId", "actorEmail", "action", "targetId", "targetType", "beforeState", "afterState", "timestamp")
      VALUES (
        'aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}',
        '${actor.id}',
        '${actor.email}',
        'SEMESTER_CREATED',
        '${newId}',
        'Semester',
        NULL,
        '{"name": "${input.name}", "isActive": ${input.isActive}}',
        NOW()
      );
    `);
  });

  return NextResponse.json({
    success: true,
    data: {
      id: newId,
      name: input.name,
      startDate: startIso,
      endDate: endIso,
      isActive: input.isActive,
      isArchived: false,
    },
    message: `Semester '${input.name}' created successfully`,
  });
});
