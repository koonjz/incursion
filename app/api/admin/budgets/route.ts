import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { withRole } from "@/src/lib/rbac/server-guard";
import { createDepartmentBudgetSchema } from "@/src/lib/validation/admin";


export interface DepartmentBudgetRecord {
  id: string;
  semesterId: string;
  department: string;
  amount: number;
  allocated: number;
  spent: number;
  currency: string;
  adminOverride: boolean;
  notes: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * GET /api/admin/budgets - List budgets for a semester with Recharts analytics aggregation
 */
export const GET = withRole(["ADMIN"], async (req: NextRequest) => {
  const url = new URL(req.url);
  let semesterId = url.searchParams.get("semesterId");

  try {
    // If no semesterId provided, default to active semester
    if (!semesterId) {
      const activeSem = await prisma.$queryRawUnsafe<Array<{ id: string }>>(`
        SELECT id FROM "Semester" WHERE "isActive" = true LIMIT 1;
      `).catch(() => []);
      if (activeSem.length > 0) {
        semesterId = activeSem[0].id;
      }
    }

    const whereClause = semesterId ? `WHERE b."semesterId" = '${semesterId}'` : "";

    const budgets = await prisma.$queryRawUnsafe<DepartmentBudgetRecord[]>(`
      SELECT 
        b.*,
        s.name as "semesterName"
      FROM "DepartmentBudget" b
      JOIN "Semester" s ON s.id = b."semesterId"
      ${whereClause}
      ORDER BY b.department ASC;
    `).catch(() => []);

    // Aggregate statistics for Recharts and summary cards
    const totalAllocated = budgets.reduce((acc, curr) => acc + (curr.allocated || 0), 0);
    const totalSpent = budgets.reduce((acc, curr) => acc + (curr.spent || 0), 0);
    const totalRemaining = Math.max(0, totalAllocated - totalSpent);
    const overallUtilization = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

    // Chart-friendly format
    const chartData = budgets.map((b) => ({
      department: b.department,
      allocated: b.allocated,
      spent: b.spent,
      remaining: Math.max(0, b.allocated - b.spent),
      utilization: b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        budgets,
        semesterId,
        summary: {
          totalAllocated,
          totalSpent,
          totalRemaining,
          utilizationPercentage: overallUtilization,
        },
        chartData,
      },
    });
  } catch (err: unknown) {
    console.error("[Budgets] Error fetching budgets:", err);
    return NextResponse.json({
      success: true,
      data: {
        budgets: [],
        semesterId: null,
        summary: { totalAllocated: 0, totalSpent: 0, totalRemaining: 0, utilizationPercentage: 0 },
        chartData: [],
      },
    });
  }
});

/**
 * POST /api/admin/budgets - Create new department budget with spent <= allocated constraint
 */
export const POST = withRole(["ADMIN"], async (req, { user: actor }) => {
  const body = await req.json();
  const input = createDepartmentBudgetSchema.parse(body);

  // Enforce spent <= allocated unless adminOverride is set
  if (!input.adminOverride && input.spent > input.allocated) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: "BUDGET_OVERSPEND_DISALLOWED",
          message: `Spent budget ($${input.spent}) exceeds allocated budget ($${input.allocated}). Check the admin override flag to authorize this allocation.`,
        },
      },
      { status: 400 }
    );
  }

  const newId = `bud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  await prisma.$executeRawUnsafe(`
    INSERT INTO "DepartmentBudget" (
      "id", "semesterId", "department", "amount", "allocated", "spent", "currency", "adminOverride", "notes", "createdAt", "updatedAt"
    ) VALUES (
      '${newId}',
      '${input.semesterId}',
      '${input.department.replace(/'/g, "''")}',
      ${input.allocated},
      ${input.allocated},
      ${input.spent},
      '${input.currency}',
      ${input.adminOverride},
      ${input.notes ? `'${input.notes.replace(/'/g, "''")}'` : "NULL"},
      NOW(),
      NOW()
    );
  `);

  // Record Audit Log
  await prisma.$executeRawUnsafe(`
    INSERT INTO "AuditLog" ("id", "actorId", "actorEmail", "action", "targetId", "targetType", "beforeState", "afterState", "timestamp")
    VALUES (
      'aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}',
      '${actor.id}',
      '${actor.email}',
      'DEPARTMENT_BUDGET_CREATED',
      '${newId}',
      'DepartmentBudget',
      NULL,
      '${JSON.stringify({ department: input.department, allocated: input.allocated, spent: input.spent, adminOverride: input.adminOverride })}',
      NOW()
    );
  `).catch(() => {});

  return NextResponse.json({
    success: true,
    data: {
      id: newId,
      ...input,
    },
    message: `Budget for ${input.department} created successfully`,
  });
});
