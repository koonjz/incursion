"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";

export type UserRole = "acm_core" | "acm_executive" | "other_club_core";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  department?: string;
}

export const DEFAULT_USER: AuthUser = {
  id: "usr_guest",
  name: "Campus User",
  email: "user@campus.edu",
  role: "acm_core",
  roleLabel: "ACM Core reviewer",
};

/** Backwards-compatibility alias for previous imports */
export const CLUB_LEAD_USER = DEFAULT_USER;
export const ACM_CORE_USER = DEFAULT_USER;
export const ACM_EXECUTIVE_USER = {
  id: "usr_lead",
  name: "Campus Executive",
  email: "executive@campus.edu",
  role: "acm_executive" as UserRole,
  roleLabel: "ACM Executive",
};
export const OTHER_CLUB_CORE_USER = {
  id: "usr_member",
  name: "Club Member",
  email: "member@campus.edu",
  role: "other_club_core" as UserRole,
  roleLabel: "Other Club Core Member",
};

interface AuthContextType {
  user: AuthUser;
  isAcmCore: boolean;
  isAcmExecutive: boolean;
  isOtherClubCore: boolean;
  canSeeConflicts: boolean;
  canAccessReviews: boolean;
  canAccessSubmissions: boolean;
  login: (role?: UserRole, email?: string, name?: string, department?: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const STORAGE_KEY = "acm_resolve_auth_user";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

let cachedRaw: string | null = null;
let cachedUser: AuthUser = DEFAULT_USER;

function getSnapshot(): AuthUser {
  if (typeof window === "undefined") {
    return DEFAULT_USER;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          // Normalize legacy "club_lead" to "acm_executive"
          if (parsed.role === "club_lead") parsed.role = "acm_executive";
          if (
            parsed.role === "acm_core" ||
            parsed.role === "acm_executive" ||
            parsed.role === "other_club_core"
          ) {
            cachedUser = parsed;
            return cachedUser;
          }
        }
      }
      cachedUser = DEFAULT_USER;
    }
    return cachedUser;
  } catch {
    return DEFAULT_USER;
  }
}

function getServerSnapshot(): AuthUser {
  return DEFAULT_USER;
}

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_USER,
  isAcmCore: true,
  isAcmExecutive: false,
  isOtherClubCore: false,
  canSeeConflicts: true,
  canAccessReviews: true,
  canAccessSubmissions: true,
  login: () => {},
  logout: () => {},
  switchRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const login = (role: UserRole = "acm_core", email?: string, name?: string, department?: string) => {
    const roleLabels: Record<UserRole, string> = {
      acm_core: "ACM Core reviewer",
      acm_executive: "ACM Executive",
      other_club_core: "Club Core Member",
    };

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanName =
      (name || "").trim() ||
      (cleanEmail
        ? cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "Campus User");

    const nextUser: AuthUser = {
      id: `usr_${cleanEmail.replace(/[^a-z0-9]/g, "_") || "user"}`,
      email: cleanEmail || "user@campus.edu",
      name: cleanName,
      role: role,
      roleLabel: roleLabels[role] || "Member",
      department: department?.trim() || undefined,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      const rbacRole =
        role === "acm_core" ? "ADMIN" : role === "acm_executive" ? "ORGANIZER" : "STUDENT";
      const jsonStr = JSON.stringify({
        id: nextUser.id,
        name: nextUser.name,
        email: nextUser.email,
        role: rbacRole,
        isActive: true,
      });
      const payload = btoa(
        encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
          String.fromCharCode(parseInt(p1, 16))
        )
      );
      const cookieVal = `demo.${payload}.sig`;
      document.cookie = `next-auth.session-token=${cookieVal}; path=/; max-age=86400; SameSite=Lax`;
      if (typeof window !== "undefined" && window.location.protocol === "https:") {
        document.cookie = `__Secure-next-auth.session-token=${cookieVal}; path=/; max-age=86400; SameSite=Lax; Secure`;
      }
    } catch {
      // ignore
    }
    notify();
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      document.cookie =
        "next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      document.cookie =
        "__Secure-next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
    } catch {
      // ignore
    }
    notify();
  };

  const switchRole = (role: UserRole) => {
    login(role);
  };

  const isAcmCore = user.role === "acm_core";
  const isAcmExecutive = user.role === "acm_executive";
  const isOtherClubCore = user.role === "other_club_core";
  const canSeeConflicts = user.role !== "other_club_core";
  const canAccessReviews = isAcmCore;
  const canAccessSubmissions = user.role !== "other_club_core";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAcmCore,
        isAcmExecutive,
        isOtherClubCore,
        canSeeConflicts,
        canAccessReviews,
        canAccessSubmissions,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
