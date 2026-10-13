"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";

export type UserRole = "acm_core" | "acm_executive" | "other_club_core";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
}

export const ACM_CORE_USER: AuthUser = {
  id: "usr_rohan",
  name: "Rohan Varma",
  email: "rohan.varma@campus.edu",
  role: "acm_core",
  roleLabel: "ACM Core reviewer",
};

export const ACM_EXECUTIVE_USER: AuthUser = {
  id: "usr_aarav",
  name: "Aarav Sharma",
  email: "aarav.sharma@campus.edu",
  role: "acm_executive",
  roleLabel: "ACM Executive",
};

export const OTHER_CLUB_CORE_USER: AuthUser = {
  id: "usr_priya",
  name: "Priya Patel",
  email: "priya.patel@robotics.campus.edu",
  role: "other_club_core",
  roleLabel: "Other Club Core Member",
};

/** Backwards-compatibility alias for previous imports */
export const CLUB_LEAD_USER = ACM_EXECUTIVE_USER;

interface AuthContextType {
  user: AuthUser;
  isAcmCore: boolean;
  isAcmExecutive: boolean;
  isOtherClubCore: boolean;
  canSeeConflicts: boolean;
  canAccessReviews: boolean;
  canAccessSubmissions: boolean;
  login: (role?: UserRole, email?: string, name?: string) => void;
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
let cachedUser: AuthUser = ACM_CORE_USER;

function getSnapshot(): AuthUser {
  if (typeof window === "undefined") {
    return ACM_CORE_USER;
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
      cachedUser = ACM_CORE_USER;
    }
    return cachedUser;
  } catch {
    return ACM_CORE_USER;
  }
}

function getServerSnapshot(): AuthUser {
  return ACM_CORE_USER;
}

const AuthContext = createContext<AuthContextType>({
  user: ACM_CORE_USER,
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

  const login = (role: UserRole = "acm_core", email?: string, name?: string) => {
    let nextUser: AuthUser;
    if (role === "acm_core") {
      nextUser = {
        ...ACM_CORE_USER,
        email: email || ACM_CORE_USER.email,
        name: name || ACM_CORE_USER.name,
      };
    } else if (role === "other_club_core") {
      nextUser = {
        ...OTHER_CLUB_CORE_USER,
        email: email || OTHER_CLUB_CORE_USER.email,
        name: name || OTHER_CLUB_CORE_USER.name,
      };
    } else {
      nextUser = {
        ...ACM_EXECUTIVE_USER,
        email: email || ACM_EXECUTIVE_USER.email,
        name: name || ACM_EXECUTIVE_USER.name,
      };
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch {
      // ignore
    }
    notify();
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
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
