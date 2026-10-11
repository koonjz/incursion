import { PrismaClient, Role, EventStatus, Severity, ExpenseCategory, ExpenseStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ACM Resolve database...");

  // 1. SEED USERS (1 Admin, 2 HODs, 5 Organizers, 20 Students)
  const admin = await prisma.user.upsert({
    where: { email: "admin@campus.edu" },
    update: {},
    create: {
      id: "usr-admin-1",
      name: "Dr. Arvind Ramesh",
      email: "admin@campus.edu",
      role: Role.ADMIN,
      department: "Administration",
    },
  });

  const hodsData = [
    { id: "usr-hod-1", name: "Dr. Sunita Sharma", email: "sunita.hod@campus.edu", department: "Computer Science" },
    { id: "usr-hod-2", name: "Dr. Rajesh Nair", email: "rajesh.hod@campus.edu", department: "Electronics" },
  ];
  for (const h of hodsData) {
    await prisma.user.upsert({
      where: { email: h.email },
      update: {},
      create: { ...h, role: Role.HOD },
    });
  }

  const organizersData = [
    { id: "usr-org-1", name: "Devansh Mehta", email: "devansh@acm.campus.edu", department: "CSE" },
    { id: "usr-org-2", name: "Aarav Gupta", email: "aarav@ieee.campus.edu", department: "ECE" },
    { id: "usr-org-3", name: "Ananya Iyer", email: "ananya@design.campus.edu", department: "Design" },
    { id: "usr-org-4", name: "Rohan Varma", email: "rohan@webdev.campus.edu", department: "CSE" },
    { id: "usr-org-5", name: "Pooja Hegde", email: "pooja@robotics.campus.edu", department: "Mechanical" },
  ];
  for (const o of organizersData) {
    await prisma.user.upsert({
      where: { email: o.email },
      update: {},
      create: { ...o, role: Role.ORGANIZER },
    });
  }

  for (let i = 1; i <= 20; i++) {
    const studentEmail = `student${i}@campus.edu`;
    await prisma.user.upsert({
      where: { email: studentEmail },
      update: {},
      create: {
        id: `usr-stu-${i}`,
        name: `Student Attendee ${i}`,
        email: studentEmail,
        role: Role.STUDENT,
        department: i % 2 === 0 ? "CSE" : "ECE",
      },
    });
  }

  // 2. SEED VENUES (5 Venues)
  const venuesData = [
    { id: "ven-lt2", name: "LT-2 (Lecture Theater 2)", capacity: 180, building: "Main Academic Block", facilities: ["Projector", "Audio System", "AC"] },
    { id: "ven-audi-a", name: "Main Auditorium A", capacity: 600, building: "Student Activity Center", facilities: ["Stage", "Dual Projector", "Live Stream Rig", "Green Room"] },
    { id: "ven-turing", name: "Turing Seminar Hall", capacity: 120, building: "CS Department (Block C)", facilities: ["Smart Board", "Mic System", "Gigabit LAN"] },
    { id: "ven-sac1", name: "SAC Multi-Purpose Hall 1", capacity: 250, building: "Student Activity Center", facilities: ["Open Floor", "Sound Console", "Modular Tables"] },
    { id: "ven-comp3", name: "Computing Lab 3", capacity: 90, building: "IT Annex", facilities: ["High-spec Workstations", "Central Projector"] },
  ];
  for (const v of venuesData) {
    await prisma.venue.upsert({
      where: { id: v.id },
      update: {},
      create: v,
    });
  }

  // 3. SEED RESOURCES (10 Resources)
  const resourcesData = [
    { id: "res-proj-4k", name: "4K Laser Projector", type: "Visual", totalQuantity: 3 },
    { id: "res-mic-cordless", name: "Cordless Collar Mics (Pair)", type: "Audio", totalQuantity: 6 },
    { id: "res-sound-mixer", name: "16-Channel Sound Console", type: "Audio", totalQuantity: 2 },
    { id: "res-stage-lights", name: "LED RGB Par Can Lighting Kit", type: "Lighting", totalQuantity: 4 },
    { id: "res-stream-cam", name: "PTZ Live Streaming Camera", type: "Video", totalQuantity: 2 },
    { id: "res-vr-headset", name: "Meta Quest VR Dev Kits", type: "Hardware", totalQuantity: 5 },
    { id: "res-extension-hub", name: "Heavy Duty Power Strips (10x)", type: "Electrical", totalQuantity: 10 },
    { id: "res-podium", name: "Acrylic Digital Podium", type: "Furniture", totalQuantity: 3 },
    { id: "res-poster-stands", name: "Adjustable Poster Display Stands", type: "Display", totalQuantity: 15 },
    { id: "res-whiteboards", name: "Mobile Magnetic Whiteboards", type: "Office", totalQuantity: 8 },
  ];
  for (const r of resourcesData) {
    await prisma.resource.upsert({
      where: { id: r.id },
      update: {},
      create: r,
    });
  }

  // 4. SEED EVENTS (30 Events, including intentional conflicts)
  const eventTypes = ["Workshop", "Symposium", "Hackathon", "Guest Lecture", "Competition", "Cultural", "General Meeting", "Networking"];
  const baseDate = new Date("2026-10-15T09:00:00Z");

  const seededEvents = [];
  for (let i = 1; i <= 30; i++) {
    const dayOffset = Math.floor((i - 1) / 3);
    const startHour = 9 + ((i - 1) % 3) * 3; // 9:00, 12:00, 15:00
    const endHour = startHour + 2;

    const startDate = new Date(baseDate);
    startDate.setDate(baseDate.getDate() + dayOffset);
    startDate.setHours(startHour, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setHours(endHour, 0, 0, 0);

    const venue = venuesData[(i - 1) % venuesData.length];
    const organizer = organizersData[(i - 1) % organizersData.length];
    const eType = eventTypes[(i - 1) % eventTypes.length];

    // Intentional conflict on event 1 & 2: Overlapping at LT-2 on October 15!
    let evStart = startDate;
    let evEnd = endDate;
    let evVenueId = venue.id;
    let evSeverity: Severity = Severity.NONE;

    if (i === 2) {
      // Direct overlap with event 1
      evStart = new Date("2026-10-15T10:00:00Z");
      evEnd = new Date("2026-10-15T12:00:00Z");
      evVenueId = "ven-lt2";
      evSeverity = Severity.CRITICAL;
    } else if (i === 5) {
      // Back-to-back buffer violation with event 4
      evStart = new Date("2026-10-16T11:05:00Z");
      evEnd = new Date("2026-10-16T13:00:00Z");
      evVenueId = "ven-audi-a";
      evSeverity = Severity.LOW;
    }

    const createdEvent = await prisma.event.upsert({
      where: { id: `evt-seed-${i}` },
      update: {},
      create: {
        id: `evt-seed-${i}`,
        title: `${eType}: Campus Showcase Session ${i}`,
        description: `Comprehensive student initiative and academic session for ${eType}.`,
        eventType: eType,
        startTime: evStart,
        endTime: evEnd,
        venueId: evVenueId,
        organizerId: organizer.id,
        expectedAttendance: 50 + (i * 12),
        attendeesGroup: ["CSE", "Technical", "Engineering"],
        conflictSeverity: evSeverity,
        status: i === 2 ? EventStatus.PENDING : EventStatus.APPROVED,
        budget: {
          create: {
            allocated: 20000 + i * 1500,
            notes: `Approved event budget allocation for #${i}`,
          },
        },
      },
    });

    seededEvents.push(createdEvent);

    // Add deliberate conflict log for event 2
    if (i === 2) {
      await prisma.conflictLog.upsert({
        where: { id: "cnf-seed-2" },
        update: {},
        create: {
          id: "cnf-seed-2",
          eventId: createdEvent.id,
          conflictType: "VENUE_OVERLAP",
          severity: Severity.CRITICAL,
          score: 95.0,
          details: {
            message: "Direct venue clash in LT-2 with Event #1",
            overlapMinutes: 60,
            conflictingEventId: "evt-seed-1",
          },
        },
      });
    }
  }

  // 5. SEED EXPENSES (60 Expenses across all categories)
  const expenseCategories = [
    ExpenseCategory.VENUE,
    ExpenseCategory.EQUIPMENT,
    ExpenseCategory.CATERING,
    ExpenseCategory.MARKETING,
    ExpenseCategory.TRAVEL,
    ExpenseCategory.PRIZES,
    ExpenseCategory.MISCELLANEOUS,
  ];

  for (let j = 1; j <= 60; j++) {
    const targetEvent = seededEvents[(j - 1) % seededEvents.length];
    const category = expenseCategories[(j - 1) % expenseCategories.length];
    const amount = 500 + (j * 175);

    await prisma.expense.upsert({
      where: { id: `exp-seed-${j}` },
      update: {},
      create: {
        id: `exp-seed-${j}`,
        eventId: targetEvent.id,
        title: `${category} logistics item #${j}`,
        amount,
        category,
        status: j % 5 === 0 ? ExpenseStatus.PENDING : ExpenseStatus.APPROVED,
        createdById: targetEvent.organizerId,
      },
    });
  }

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
