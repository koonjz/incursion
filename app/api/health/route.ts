import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  try {
    const pingStart = Date.now();
    await prisma.$queryRawUnsafe(`SELECT 1;`);
    dbLatencyMs = Date.now() - pingStart;
  } catch (err: unknown) {
    dbStatus = "unreachable";
    dbError = err instanceof Error ? err.message : "Database connection failed";
  }

  const isHealthy = dbStatus === "healthy";
  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      version: "1.0.0-m1",
      environment: process.env.NODE_ENV || "development",
      uptimeSeconds: Math.floor(process.uptime()),
      totalLatencyMs: Date.now() - startTime,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        ...(dbError ? { error: dbError } : {}),
      },
    },
    { status: statusCode }
  );
}
