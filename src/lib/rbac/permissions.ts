import { UserRole } from "@/src/modules/auth/rbac";

export type ExtendedRole = UserRole | "VIEWER";

export type Permission =
  // Events
  | "events:view"
  | "events:create"
  | "events:edit_own"
  | "events:delete_own"
  | "events:review"
  | "events:override_conflicts"
  // Resources & Venues
  | "resources:view"
  | "resources:book"
  | "resources:manage"
  // Budgets & Expenses
  | "budgets:view"
  | "budgets:create"
  | "budgets:edit"
  | "budgets:delete"
  | "budgets:override"
  | "expenses:submit"
  | "expenses:approve"
  // Semester Lifecycle
  | "semesters:view"
  | "semesters:manage"
  // User & Access Administration
  | "users:view"
  | "users:manage_roles"
  | "users:deactivate"
  // System Audit
  | "audit:view";

/**
 * Single source of truth permission matrix for campus roles.
 */
export const ROLE_PERMISSIONS: Record<ExtendedRole, Permission[]> = {
  ADMIN: [
    "events:view",
    "events:create",
    "events:edit_own",
    "events:delete_own",
    "events:review",
    "events:override_conflicts",
    "resources:view",
    "resources:book",
    "resources:manage",
    "budgets:view",
    "budgets:create",
    "budgets:edit",
    "budgets:delete",
    "budgets:override",
    "expenses:submit",
    "expenses:approve",
    "semesters:view",
    "semesters:manage",
    "users:view",
    "users:manage_roles",
    "users:deactivate",
    "audit:view",
  ],
  HOD: [
    "events:view",
    "events:create",
    "events:edit_own",
    "events:review",
    "resources:view",
    "resources:book",
    "budgets:view",
    "expenses:submit",
    "expenses:approve",
    "semesters:view",
    "audit:view",
  ],
  ORGANIZER: [
    "events:view",
    "events:create",
    "events:edit_own",
    "resources:view",
    "resources:book",
    "budgets:view",
    "expenses:submit",
    "semesters:view",
  ],
  STUDENT: [
    "events:view",
    "resources:view",
    "semesters:view",
  ],
  VIEWER: [
    "events:view",
    "resources:view",
    "semesters:view",
  ],
};

/**
 * Normalizes a role string to align VIEWER and STUDENT.
 */
export function normalizeRole(role: ExtendedRole | string): UserRole {
  if (role === "VIEWER") return "STUDENT";
  return role as UserRole;
}

/**
 * Checks whether a given role is included in the allowed roles list.
 * Respects VIEWER / STUDENT equivalence.
 */
export function hasRole(
  userRole: ExtendedRole | null | undefined,
  allowedRoles: (ExtendedRole)[]
): boolean {
  if (!userRole) return false;
  const normalizedUserRole = normalizeRole(userRole);
  const normalizedAllowed = allowedRoles.map(normalizeRole);
  return normalizedAllowed.includes(normalizedUserRole);
}

/**
 * Checks if a given role possesses a specific permission.
 */
export function can(role: ExtendedRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[normalizeRole(role)] || [];
  return permissions.includes(permission);
}
