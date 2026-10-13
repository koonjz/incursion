/**
 * Database Connection Verification Script
 *
 * Connects to both DATABASE_URL (pooled) and DIRECT_URL (direct),
 * executes a health ping (SELECT 1), retrieves PostgreSQL server version,
 * and reports query latency. Exits with code 1 on any failure.
 */
import { PrismaClient } from "@prisma/client";

function sanitizeUrl(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    return `${parsed.protocol}//${parsed.username ? "***:***@" : ""}${parsed.host}${parsed.pathname}`;
  } catch {
    return "[Invalid or Unparseable URL]";
  }
}

interface TestResult {
  name: string;
  urlType: "POOLED (DATABASE_URL)" | "DIRECT (DIRECT_URL)";
  sanitizedUrl: string;
  latencyMs: number;
  serverVersion: string;
  status: "SUCCESS" | "FAILED";
  error?: string;
}

async function testConnection(
  name: string,
  urlType: "POOLED (DATABASE_URL)" | "DIRECT (DIRECT_URL)",
  connectionString: string | undefined
): Promise<TestResult> {
  if (!connectionString) {
    return {
      name,
      urlType,
      sanitizedUrl: "NOT SET",
      latencyMs: 0,
      serverVersion: "N/A",
      status: "FAILED",
      error: "Environment variable is missing or empty",
    };
  }

  const sanitized = sanitizeUrl(connectionString);
  const client = new PrismaClient({
    datasources: {
      db: { url: connectionString },
    },
    log: ["error"],
  });

  try {
    const startTime = Date.now();
    await client.$connect();

    // Query server version and ping
    const rows = await client.$queryRawUnsafe<Array<{ version: string }>>(
      "SELECT version();"
    );
    const latencyMs = Date.now() - startTime;
    const serverVersion = rows[0]?.version?.split(" ")[0] + " " + (rows[0]?.version?.split(" ")[1] ?? "");

    await client.$disconnect();

    return {
      name,
      urlType,
      sanitizedUrl: sanitized,
      latencyMs,
      serverVersion: serverVersion || "PostgreSQL (Unknown version)",
      status: "SUCCESS",
    };
  } catch (err: unknown) {
    await client.$disconnect().catch(() => {});
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      name,
      urlType,
      sanitizedUrl: sanitized,
      latencyMs: 0,
      serverVersion: "N/A",
      status: "FAILED",
      error: errorMessage,
    };
  }
}

async function main() {
  console.log("===============================================================");
  console.log(" Running Neon Database Connection Pre-Flight Check");
  console.log("===============================================================\n");

  const pooledUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  const results: TestResult[] = [];

  console.log("1. Testing Pooled Runtime Connection (DATABASE_URL)...");
  results.push(await testConnection("Pooled Connection", "POOLED (DATABASE_URL)", pooledUrl));

  console.log("2. Testing Direct Migration Connection (DIRECT_URL)...");
  results.push(await testConnection("Direct Connection", "DIRECT (DIRECT_URL)", directUrl));

  console.log("\n---------------------------------------------------------------");
  console.log(" Connection Summary:");
  console.log("---------------------------------------------------------------");

  let allPassed = true;

  for (const res of results) {
    console.log(`\nEndpoint: [${res.urlType}]`);
    console.log(`Target:   ${res.sanitizedUrl}`);
    console.log(`Status:   ${res.status}`);

    if (res.status === "SUCCESS") {
      console.log(`Latency:  ${res.latencyMs} ms`);
      console.log(`Version:  ${res.serverVersion}`);
    } else {
      console.log(`Error:    ${res.error}`);
      allPassed = false;
    }
  }

  console.log("\n===============================================================");
  if (allPassed) {
    console.log(" RESULT: ALL DATABASE CONNECTIONS VERIFIED SUCCESSFULLY (PASS)");
    console.log("===============================================================\n");
    process.exit(0);
  } else {
    console.error(" RESULT: DATABASE CONNECTION VERIFICATION FAILED (FAIL)");
    console.error("===============================================================\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected script failure:", err);
  process.exit(1);
});
