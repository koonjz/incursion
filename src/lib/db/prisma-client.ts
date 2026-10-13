/**
 * Serverless-Safe Prisma Client Singleton for Neon & Vercel
 *
 * Implements connection caching across Vercel serverless function warm executions
 * and prevents connection pool exhaustion in hot-reloading development environments.
 */
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var globalPrismaClient: PrismaClient | undefined;
}

export function createPrismaClient(): PrismaClient {
  const isProd = process.env.NODE_ENV === "production";

  return new PrismaClient({
    log: isProd ? ["error"] : ["error", "warn"],
  });
}

/**
 * Cached singleton instance.
 * Re-uses the existing client instance if available in globalThis.
 */
export const prismaClient: PrismaClient =
  globalThis.globalPrismaClient ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.globalPrismaClient = prismaClient;
}

export default prismaClient;
