/**
 * Environment Variables & Production Secrets Verification Script
 *
 * Validates production environment variables using Zod schemas and security rules:
 * - DATABASE_URL must contain '-pooler' and 'sslmode=require'
 * - DIRECT_URL must NOT contain '-pooler'
 * - NEXTAUTH_URL must be HTTPS without trailing slash when NODE_ENV=production
 * - NEXTAUTH_SECRET must have adequate cryptographic entropy
 * - Output a structured pass/fail table.
 */
import { z } from "zod";

interface CheckItem {
  variable: string;
  category: string;
  requiredInProd: boolean;
  status: "PASS" | "FAIL" | "WARN";
  message: string;
}

const checks: CheckItem[] = [];

function recordCheck(
  variable: string,
  category: string,
  requiredInProd: boolean,
  passed: boolean,
  message: string,
  isWarn = false
) {
  checks.push({
    variable,
    category,
    requiredInProd,
    status: passed ? "PASS" : isWarn ? "WARN" : "FAIL",
    message,
  });
}

const isProduction = process.env.NODE_ENV === "production";

// 1. DATABASE_URL validation
const dbUrl = process.env.DATABASE_URL || "";
if (!dbUrl) {
  recordCheck("DATABASE_URL", "Database", true, false, "Missing or empty");
} else {
  const hasPooler = dbUrl.includes("-pooler");
  const hasSsl = dbUrl.includes("sslmode=require");
  if (!hasPooler) {
    recordCheck(
      "DATABASE_URL",
      "Database",
      true,
      false,
      "Hostname must contain '-pooler' for serverless connection pooling"
    );
  } else if (!hasSsl) {
    recordCheck(
      "DATABASE_URL",
      "Database",
      true,
      false,
      "Must include 'sslmode=require' query parameter"
    );
  } else {
    recordCheck("DATABASE_URL", "Database", true, true, "Valid pooled connection string with SSL");
  }
}

// 2. DIRECT_URL validation
const directUrl = process.env.DIRECT_URL || "";
if (!directUrl) {
  recordCheck(
    "DIRECT_URL",
    "Database",
    true,
    false,
    "Missing or empty (required for migration locking)"
  );
} else {
  const hasPooler = directUrl.includes("-pooler");
  const hasSsl = directUrl.includes("sslmode=require");
  if (hasPooler) {
    recordCheck(
      "DIRECT_URL",
      "Database",
      true,
      false,
      "Must NOT contain '-pooler' (requires direct PostgreSQL connection)"
    );
  } else if (!hasSsl) {
    recordCheck(
      "DIRECT_URL",
      "Database",
      true,
      false,
      "Must include 'sslmode=require' query parameter"
    );
  } else {
    recordCheck("DIRECT_URL", "Database", true, true, "Valid direct connection string with SSL");
  }
}

// 3. NEXTAUTH_URL validation
const nextAuthUrl = process.env.NEXTAUTH_URL || "";
if (!nextAuthUrl) {
  recordCheck("NEXTAUTH_URL", "Authentication", true, false, "Missing or empty");
} else {
  const hasTrailingSlash = nextAuthUrl.endsWith("/");
  const isHttps = nextAuthUrl.startsWith("https://");
  const isLocal = nextAuthUrl.startsWith("http://localhost");

  if (hasTrailingSlash) {
    recordCheck("NEXTAUTH_URL", "Authentication", true, false, "Must not have trailing slash");
  } else if (isProduction && !isHttps) {
    recordCheck("NEXTAUTH_URL", "Authentication", true, false, "Must use https:// protocol in production");
  } else if (!isProduction && !isHttps && !isLocal) {
    recordCheck("NEXTAUTH_URL", "Authentication", true, false, "Must use https:// or http://localhost", true);
  } else {
    recordCheck("NEXTAUTH_URL", "Authentication", true, true, "Valid canonical application URL");
  }
}

// 4. NEXTAUTH_SECRET validation
const nextAuthSecret = process.env.NEXTAUTH_SECRET || "";
if (!nextAuthSecret) {
  recordCheck("NEXTAUTH_SECRET", "Authentication", true, false, "Missing or empty");
} else if (nextAuthSecret.length < 32) {
  recordCheck(
    "NEXTAUTH_SECRET",
    "Authentication",
    true,
    false,
    `Too short (${nextAuthSecret.length} chars). Minimum 32 characters required for cryptographic entropy`
  );
} else {
  recordCheck("NEXTAUTH_SECRET", "Authentication", true, true, "Adequate cryptographic entropy (32+ chars)");
}

// 5. GOOGLE_CLIENT_ID & SECRET
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
if (!googleClientId) {
  recordCheck("GOOGLE_CLIENT_ID", "OAuth", true, false, "Missing or empty", !isProduction);
} else if (!googleClientId.includes(".apps.googleusercontent.com")) {
  recordCheck("GOOGLE_CLIENT_ID", "OAuth", true, false, "Invalid format (expected *.apps.googleusercontent.com)");
} else {
  recordCheck("GOOGLE_CLIENT_ID", "OAuth", true, true, "Valid Google Client ID format");
}

const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
if (!googleClientSecret) {
  recordCheck("GOOGLE_CLIENT_SECRET", "OAuth", true, false, "Missing or empty", !isProduction);
} else if (googleClientSecret.length < 10) {
  recordCheck("GOOGLE_CLIENT_SECRET", "OAuth", true, false, "Secret is suspiciously short");
} else {
  recordCheck("GOOGLE_CLIENT_SECRET", "OAuth", true, true, "Secret populated");
}

// 6. ALLOWED_EMAIL_DOMAIN & INITIAL_ADMIN_EMAILS
const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || "";
if (!allowedDomain) {
  recordCheck("ALLOWED_EMAIL_DOMAIN", "RBAC", true, false, "Missing or empty (e.g. university.edu)");
} else {
  recordCheck("ALLOWED_EMAIL_DOMAIN", "RBAC", true, true, `Restricted to '${allowedDomain}'`);
}

const initialAdmins = process.env.INITIAL_ADMIN_EMAILS || "";
if (!initialAdmins) {
  recordCheck("INITIAL_ADMIN_EMAILS", "RBAC", true, false, "Missing. At least one admin email required to bootstrap roles");
} else {
  const emails = initialAdmins.split(",").map((e) => e.trim());
  const invalidEmail = emails.find((e) => !z.string().email().safeParse(e).success);
  if (invalidEmail) {
    recordCheck("INITIAL_ADMIN_EMAILS", "RBAC", true, false, `Contains invalid email format: '${invalidEmail}'`);
  } else {
    recordCheck("INITIAL_ADMIN_EMAILS", "RBAC", true, true, `${emails.length} bootstrap admin email(s) configured`);
  }
}

// 7. Email service (RESEND_API_KEY, EMAIL_FROM)
const resendApiKey = process.env.RESEND_API_KEY || "";
if (!resendApiKey) {
  recordCheck("RESEND_API_KEY", "Email", false, false, "Unset (system will operate in mock email mode)", true);
} else {
  recordCheck("RESEND_API_KEY", "Email", false, true, "Configured");
}

const emailFrom = process.env.EMAIL_FROM || "";
if (!emailFrom) {
  recordCheck("EMAIL_FROM", "Email", false, false, "Unset (default notifications address not defined)", true);
} else {
  recordCheck("EMAIL_FROM", "Email", false, true, "Configured");
}

// 8. Storage provider
const storageProvider = process.env.STORAGE_PROVIDER || "mock";
recordCheck("STORAGE_PROVIDER", "Storage", false, true, `Configured as '${storageProvider}'`);

// Output table
console.log("==========================================================================================");
console.log(` Environment Variables Verification (${isProduction ? "PRODUCTION" : "DEVELOPMENT/TEST"})`);
console.log("==========================================================================================\n");

const pad = (str: string, length: number) => (str + " ".repeat(length)).slice(0, length);

console.log(
  pad("VARIABLE", 24) +
  pad("CATEGORY", 16) +
  pad("STATUS", 8) +
  "DETAILS"
);
console.log("-".repeat(90));

let hasErrors = false;

for (const c of checks) {
  const statusColor = c.status === "PASS" ? "[PASS]" : c.status === "WARN" ? "[WARN]" : "[FAIL]";
  console.log(
    pad(c.variable, 24) +
    pad(c.category, 16) +
    pad(statusColor, 8) +
    c.message
  );

  if (c.status === "FAIL" && (isProduction || c.requiredInProd)) {
    hasErrors = true;
  }
}

console.log("-".repeat(90));

if (hasErrors) {
  console.error("\nRESULT: FAILED — One or more critical production environment variables are invalid.");
  process.exit(1);
} else {
  console.log("\nRESULT: PASSED — All verified environment variables meet production readiness standards.");
  process.exit(0);
}
