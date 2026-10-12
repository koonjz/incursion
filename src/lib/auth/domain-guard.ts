import { UserRole } from "@/src/modules/auth/rbac";

/**
 * Validates if an email adheres to the configured college institutional domain.
 * Supports exact domain (user@college.edu) or subdomains (user@cs.college.edu).
 */
export function validateEmailDomain(email: string | null | undefined, allowedDomain?: string): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

  const domain = allowedDomain || process.env.ALLOWED_EMAIL_DOMAIN;
  if (!domain || domain === "*") {
    return true; // Unrestricted domain in staging or local sandbox
  }

  const parts = cleanEmail.split("@");
  if (parts.length !== 2) return false;

  const emailHost = parts[1];
  const targetHost = domain.toLowerCase().trim();

  return emailHost === targetHost || emailHost.endsWith(`.${targetHost}`);
}

/**
 * Checks if the given email is listed in the INITIAL_ADMIN_EMAILS bootstrap environment list.
 */
export function isInitialAdmin(email: string | null | undefined, adminListEnv?: string): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

  const rawList = adminListEnv || process.env.INITIAL_ADMIN_EMAILS || "";
  const adminEmails = rawList
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(cleanEmail);
}

/**
 * Determines the initial role assigned to a user upon their first authentication.
 */
export function determineInitialRole(email: string): UserRole {
  if (isInitialAdmin(email)) {
    return "ADMIN";
  }
  return "STUDENT"; // M1 Viewer tier
}
