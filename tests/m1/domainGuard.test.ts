import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateEmailDomain, isInitialAdmin, determineInitialRole } from "@/src/lib/auth/domain-guard";

describe("M1 Auth: College Domain Guard & Admin Bootstrap", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("validates college domain strictly", () => {
    process.env.ALLOWED_EMAIL_DOMAIN = "university.edu";

    expect(validateEmailDomain("student@university.edu")).toBe(true);
    expect(validateEmailDomain("faculty@cs.university.edu")).toBe(true);
    expect(validateEmailDomain("attacker@gmail.com")).toBe(false);
    expect(validateEmailDomain("fake@university.edu.evil.com")).toBe(false);
    expect(validateEmailDomain("")).toBe(false);
    expect(validateEmailDomain(null)).toBe(false);
  });

  it("permits any domain when ALLOWED_EMAIL_DOMAIN is '*'", () => {
    process.env.ALLOWED_EMAIL_DOMAIN = "*";

    expect(validateEmailDomain("anyone@gmail.com")).toBe(true);
    expect(validateEmailDomain("test@domain.org")).toBe(true);
  });

  it("identifies initial admin emails case-insensitively", () => {
    process.env.INITIAL_ADMIN_EMAILS = "admin@university.edu, dean@university.edu ,TechLead@University.edu";

    expect(isInitialAdmin("admin@university.edu")).toBe(true);
    expect(isInitialAdmin("ADMIN@UNIVERSITY.EDU")).toBe(true);
    expect(isInitialAdmin("dean@university.edu")).toBe(true);
    expect(isInitialAdmin("techlead@university.edu")).toBe(true);
    expect(isInitialAdmin("student@university.edu")).toBe(false);
    expect(isInitialAdmin("")).toBe(false);
  });

  it("assigns ADMIN role to bootstrap emails and STUDENT to others", () => {
    process.env.INITIAL_ADMIN_EMAILS = "admin@university.edu";

    expect(determineInitialRole("admin@university.edu")).toBe("ADMIN");
    expect(determineInitialRole("newstudent@university.edu")).toBe("STUDENT");
  });
});
