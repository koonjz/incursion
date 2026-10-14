const { PrismaClient } = require("@prisma/client");

const targetUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!targetUrl) {
  console.error("No database URL found");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: targetUrl,
    },
  },
});

async function main() {
  console.log("Inspecting and releasing Prisma advisory locks...");
  try {
    // 1. Query all locks holding Prisma migration lock (72707369)
    const locks = await prisma.$queryRawUnsafe(`
      SELECT l.pid, l.locktype, l.objid::text as objid, a.state, a.query
      FROM pg_locks l
      LEFT JOIN pg_stat_activity a ON l.pid = a.pid
      WHERE l.locktype = 'advisory' AND l.objid = 72707369
    `);

    console.log("Found advisory locks on 72707369:", locks);

    if (Array.isArray(locks) && locks.length > 0) {
      for (const lock of locks) {
        if (lock.pid) {
          console.log(`Terminating process PID ${lock.pid} holding advisory lock...`);
          try {
            await prisma.$executeRawUnsafe(`SELECT pg_terminate_backend(${lock.pid})`);
            console.log(`Successfully terminated PID ${lock.pid}`);
          } catch (termErr) {
            console.warn(`Could not terminate PID ${lock.pid}:`, termErr.message);
          }
        }
      }
    }

    // 2. Also run pg_advisory_unlock_all
    try {
      await prisma.$executeRawUnsafe(`SELECT pg_advisory_unlock_all()`);
      console.log("Called pg_advisory_unlock_all()");
    } catch (e) {
      // ignore
    }

    // 3. Verify locks are clear
    const remaining = await prisma.$queryRawUnsafe(`
      SELECT l.pid, l.objid::text as objid FROM pg_locks l WHERE l.locktype = 'advisory' AND l.objid = 72707369
    `);
    console.log("Remaining advisory locks:", remaining);
    console.log("Advisory locks cleared successfully!");
  } catch (err) {
    console.error("Error clearing advisory locks:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
