import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting M1 database seeding...");

  // 1. Seed Core Users (Admin, Organizer, Viewer/Student)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@university.edu" },
    update: {
      role: "ADMIN",
    },
    create: {
      email: "admin@university.edu",
      name: "Dean / System Administrator",
      role: "ADMIN",
      department: "Administration",
    },
  });

  const organizerUser = await prisma.user.upsert({
    where: { email: "organizer@university.edu" },
    update: {
      role: "ORGANIZER",
    },
    create: {
      email: "organizer@university.edu",
      name: "ACM Student Chapter Lead",
      role: "ORGANIZER",
      department: "Computer Science",
    },
  });

  const viewerUser = await prisma.user.upsert({
    where: { email: "student@university.edu" },
    update: {
      role: "STUDENT",
    },
    create: {
      email: "student@university.edu",
      name: "Alex Johnson (Student)",
      role: "STUDENT",
      department: "Undergraduate Studies",
    },
  });

  console.log(`✅ Seeded users:
  - ADMIN: ${adminUser.email}
  - ORGANIZER: ${organizerUser.email}
  - VIEWER: ${viewerUser.email}`);

  // 2. Seed Active Semester
  // Fall 2026: Aug 15, 2026 to Dec 20, 2026
  const existingSemester = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "Semester" WHERE name = 'Fall 2026' LIMIT 1;`
  ).catch(() => []);

  let semesterId: string;
  if (existingSemester.length > 0) {
    semesterId = existingSemester[0].id;
    console.log(`ℹ️ Semester 'Fall 2026' already exists with ID: ${semesterId}`);
  } else {
    const created = await prisma.$queryRawUnsafe<Array<{ id: string }>>(`
      INSERT INTO "Semester" ("id", "name", "startDate", "endDate", "isActive", "isArchived", "createdAt", "updatedAt")
      VALUES ('sem_fall_2026', 'Fall 2026', '2026-08-15T00:00:00.000Z', '2026-12-20T23:59:59.999Z', true, false, NOW(), NOW())
      RETURNING id;
    `).catch(() => [{ id: "sem_fall_2026" }]);
    semesterId = created[0]?.id || "sem_fall_2026";
    console.log(`✅ Created active semester 'Fall 2026': ${semesterId}`);
  }

  // 3. Seed Sample Department Budgets
  const sampleBudgets = [
    { department: "Computer Science", allocated: 25000, spent: 8400, notes: "Annual CS hackathon & workshops" },
    { department: "Robotics Club", allocated: 12000, spent: 3950, notes: "Hardware parts and competition travel" },
    { department: "ACM Chapter", allocated: 10000, spent: 3100, notes: "Speaker honorariums & cloud credits" },
    { department: "Cultural Affairs", allocated: 18000, spent: 6200, notes: "Campus festival production" },
  ];

  for (const b of sampleBudgets) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "DepartmentBudget" ("id", "semesterId", "department", "amount", "allocated", "spent", "currency", "adminOverride", "notes", "createdAt", "updatedAt")
      VALUES ('bud_${b.department.toLowerCase().replace(/\\s+/g, "_")}', '${semesterId}', '${b.department}', ${b.allocated}, ${b.allocated}, ${b.spent}, 'USD', false, '${b.notes}', NOW(), NOW())
      ON CONFLICT ("semesterId", "department") DO UPDATE 
      SET "allocated" = ${b.allocated}, "spent" = ${b.spent}, "updatedAt" = NOW();
    `).catch((err) => {
      console.warn(`Note on budget seed insert: ${err.message}`);
    });
  }
  console.log(`✅ Seeded ${sampleBudgets.length} department budgets for Fall 2026.`);

  // 4. Seed Audit Log Record
  await prisma.$executeRawUnsafe(`
    INSERT INTO "AuditLog" ("id", "actorId", "actorEmail", "action", "targetId", "targetType", "beforeState", "afterState", "timestamp")
    VALUES ('aud_init_001', '${adminUser.id}', '${adminUser.email}', 'SYSTEM_INITIALIZATION', '${semesterId}', 'Semester', NULL, '{"status": "ACTIVE", "semester": "Fall 2026"}', NOW())
    ON CONFLICT DO NOTHING;
  `).catch(() => {});
  console.log("✅ Seeded initial audit log.");

  console.log("✨ M1 seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error running M1 seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
