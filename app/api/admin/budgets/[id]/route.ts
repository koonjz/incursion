import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { withRole } from "@/src/lib/rbac/server-guard";
import { updateDepartmentBudgetSchema } from "@/src/lib/validation/admin";
import { DepartmentBudgetRecord } from "../route";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/budgets/[id] - Update department budget
 */
export const PATCH = withRole(["ADMIN"], async (req, { user: actor, params }) => {
  const budgetId = params?.id as string;
  if (!budgetId) {
    return NextResponse.json(
      { success: false, data: null, error: { code: "BAD_REQUEST", message: "Budget ID is required" } },
      { status: 400 }
    );
  }

  const existingList = await prisma.$queryRawUnsafe<DepartmentBudgetRecord[]>(`
    SELECT * FROM "DepartmentBudget" WHERE id = '${budgetId}' LIMIT 1;
  `).catch(() => []);

  if (existingList.length === 0) {
    return NextResponse.json(
      { success: false, data: null, error: { code: "NOT_FOUND", message: "Budget not found" } },
      { status: 404 }
    );
  }

  const existing = existingList[0];
  const body = await req.json();
  const input = updateDepartmentBudgetSchema.parse(body);

  const newAllocated = input.allocated !== undefined ? input.allocated : existing.allocated;
  const newSpent = input.spent !== undefined ? input.spent : existing.spent;
  const newOverride = input.adminOverride !== undefined ? input.adminOverride : existing.adminOverride;

  if (!newOverride && newSpent > newAllocated) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: "BUDGET_OVERSPEND_DISALLOWED",
          message: `Spent amount ($${newSpent}) exceeds allocated amount ($${newAllocated}). Admin override flag must be enabled.`,
        },
      },
      { status: 400 }
    );
  }

  const updates: string[] = [
    `"allocated" = ${newAllocated}`,
    `"spent" = ${newSpent}`,
    `"adminOverride" = ${newOverride}`,
    `"updatedAt" = NOW()`,
  ];
  if (input.currency) updates.push(`"currency" = '${input.currency}'`);
  if (input.notes !== undefined) {
    updates.push(input.notes ? `"notes" = '${input.notes.replace(/'/g, "''")}'` : `"notes" = NULL`);
  }

  await prisma.$executeRawUnsafe(`
    UPDATE "DepartmentBudget" SET ${updates.join(", ")} WHERE id = '${budgetId}';
  `);

  // Record Audit Log
  await prisma.$executeRawUnsafe(`
    INSERT INTO "AuditLog" ("id", "actorId", "actorEmail", "action", "targetId", "targetType", "beforeState", "afterState", "timestamp")
    VALUES (
      'aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}',
      '${actor.id}',
      '${actor.email}',
      'DEPARTMENT_BUDGET_UPDATED',
      '${budgetId}',
      'DepartmentBudget',
      '${JSON.stringify({ allocated: existing.allocated, spent: existing.spent, adminOverride: existing.adminOverride })}',
      '${JSON.stringify({ allocated: newAllocated, spent: newSpent, adminOverride: newOverride })}',
      NOW()
    );
  `).catch(() => {});

  return NextResponse.json({
    success: true,
    message: "Budget updated successfully",
  });
});

/**
 * DELETE /api/admin/budgets/[id] - Remove department budget
 */
export const DELETE = withRole(["ADMIN"], async (req, { user: actor, params }) => {
  const budgetId = params?.id as string;
  if (!budgetId) {
    return NextResponse.json(
      { success: false, data: null, error: { code: "BAD_REQUEST", message: "Budget ID is required" } },
      { status: 400 }
    );
  }

  await prisma.$executeRawUnsafe(`
    DELETE FROM "DepartmentBudget" WHERE id = '${budgetId}';
  `);

  // Record Audit Log
  await prisma.$executeRawUnsafe(`
    INSERT INTO "AuditLog" ("id", "actorId", "actorEmail", "action", "targetId", "targetType", "beforeState", "afterState", "timestamp")
    VALUES (
      'aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}',
      '${actor.id}',
      '${actor.email}',
      'DEPARTMENT_BUDGET_DELETED',
      '${budgetId}',
      'DepartmentBudget',
      NULL,
      NULL,
      NOW()
    );
  `).catch(() => {});

  return NextResponse.json({
    success: true,
    message: "Budget deleted successfully",
  });
});
