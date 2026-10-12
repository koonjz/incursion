"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@/src/modules/auth/rbac";
import { hasRole, can, Permission } from "@/src/lib/rbac/permissions";

export function useRole() {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const user = session?.user;
  const role = (user?.role as UserRole | undefined) || "STUDENT";
  const isActive = user?.isActive !== false;

  return {
    user,
    role,
    isActive,
    isLoading,
    isAuthenticated,
    isAdmin: role === "ADMIN",
    isOrganizer: role === "ORGANIZER" || role === "HOD",
    isViewer: role === "STUDENT",
    hasRole: (allowedRoles: (UserRole | "VIEWER")[]) => hasRole(role, allowedRoles),
    can: (permission: Permission) => can(role, permission),
  };
}
