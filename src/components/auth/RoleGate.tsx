"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { hasRole, ExtendedRole } from "@/src/lib/rbac/permissions";
import { UserRole } from "@/src/modules/auth/rbac";

export interface RoleGateProps {
  roles: ExtendedRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client component to conditionally render children based on session user role.
 */
export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  const userRole = (session?.user?.role as UserRole | undefined) || "STUDENT";
  const isAllowed = hasRole(userRole, roles);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
