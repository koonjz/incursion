/**
 * Production Database Seeding Guard
 *
 * Prevents accidental execution of test/demo seed scripts against production databases.
 * In production, administrative users must only be created via the INITIAL_ADMIN_EMAILS
 * bootstrap mechanism upon their initial Google OAuth sign-in.
 */

export function assertSafeToSeed(): void {
  const isProductionEnv = process.env.NODE_ENV === "production";
  const forceSeed = process.env.FORCE_SEED === "true";

  const targetUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  const isLikelyProductionHost =
    targetUrl.includes("neon.tech") &&
    !targetUrl.includes("preview") &&
    !targetUrl.includes("dev") &&
    !targetUrl.includes("test");

  if (forceSeed) {
    console.warn("⚠️  WARNING: FORCE_SEED=true detected. Proceeding with database seeding on target environment.");
    return;
  }

  if (isProductionEnv || isLikelyProductionHost) {
    console.error("================================================================================");
    console.error("⛔ FATAL: SEED EXECUTION BLOCKED BY PRODUCTION GUARD");
    console.error("================================================================================");
    console.error("Attempted to run demo seed script against a production database environment!");
    console.error(`- NODE_ENV: '${process.env.NODE_ENV}'`);
    console.error(`- Target host appears to be a production endpoint.`);
    console.error("");
    console.error("Production Rule:");
    console.error("Demo seeds must NEVER be run in production.");
    console.error("The initial administrator account is automatically provisioned via the");
    console.error("INITIAL_ADMIN_EMAILS environment variable upon their first Google sign-in.");
    console.error("");
    console.error("If you explicitly require seeding this database, re-run with FORCE_SEED=true.");
    console.error("================================================================================");
    process.exit(1);
  }

  console.log("✅ Production seed guard passed: Non-production environment detected.");
}

// Execute immediately when run directly via CLI
if (require.main === module || process.argv[1]?.includes("seed-production-guard")) {
  assertSafeToSeed();
}
