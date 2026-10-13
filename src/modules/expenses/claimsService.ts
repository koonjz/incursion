import { prisma } from "@/src/lib/prisma";
import { ExpenseCategory, ExpenseStatus } from "@prisma/client";
import type { CategoryCap, EventVarianceLineItem, ExpenseClaim } from "@/lib/types/expenses";
import {
  MOCK_CATEGORY_CAPS,
  MOCK_EVENT_VARIANCE,
  MOCK_EXPENSE_CLAIMS,
  MOCK_EXPENSE_METRICS,
} from "@/lib/mock/expenses";

export const UI_TO_DB_CATEGORY: Record<string, ExpenseCategory> = {
  "Food & Catering": ExpenseCategory.CATERING,
  "Equipment & Hardware": ExpenseCategory.EQUIPMENT,
  "Marketing & Swag": ExpenseCategory.MARKETING,
  Transportation: ExpenseCategory.TRAVEL,
  "Venue & Audio": ExpenseCategory.VENUE,
  "Printing & Certificates": ExpenseCategory.MISCELLANEOUS,
};

export const DB_TO_UI_CATEGORY: Record<ExpenseCategory, string> = {
  [ExpenseCategory.CATERING]: "Food & Catering",
  [ExpenseCategory.EQUIPMENT]: "Equipment & Hardware",
  [ExpenseCategory.MARKETING]: "Marketing & Swag",
  [ExpenseCategory.TRAVEL]: "Transportation",
  [ExpenseCategory.VENUE]: "Venue & Audio",
  [ExpenseCategory.MISCELLANEOUS]: "Printing & Certificates",
  [ExpenseCategory.PRIZES]: "Equipment & Hardware",
};

export const DEFAULT_CATEGORY_CAPS: Record<string, number> = {
  "Food & Catering": 25000,
  "Equipment & Hardware": 25000,
  "Marketing & Swag": 15000,
  Transportation: 10000,
  "Venue & Audio": 15000,
  "Printing & Certificates": 10000,
};

// In-memory fallback / cache for runtime claims
let runtimeClaims: ExpenseClaim[] = [...MOCK_EXPENSE_CLAIMS];

export interface GetClaimsFilters {
  eventId?: string;
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listAllClaims(filters: GetClaimsFilters = {}) {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 50));

  try {
    const where: Record<string, unknown> = {};
    if (filters.eventId) where.eventId = filters.eventId;
    if (filters.status) {
      const upper = filters.status.toUpperCase();
      if (upper === "APPROVED" || upper === "PENDING" || upper === "REJECTED") {
        where.status = upper as ExpenseStatus;
      }
    }
    if (filters.category && UI_TO_DB_CATEGORY[filters.category]) {
      where.category = UI_TO_DB_CATEGORY[filters.category];
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { event: { title: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    const [dbCount, dbExpenses] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          receipt: { select: { id: true, fileName: true, fileUrl: true } },
          event: { select: { id: true, title: true } },
        },
      }),
    ]);

    if (dbExpenses && dbExpenses.length > 0) {
      const claims: ExpenseClaim[] = dbExpenses.map((e) => {
        const initials = e.createdBy?.name
          ? e.createdBy.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : "AC";

        return {
          id: e.id,
          date: e.createdAt.toISOString().split("T")[0],
          event: e.event?.title || "Campus Event",
          category: (DB_TO_UI_CATEGORY[e.category] || "Food & Catering") as any,
          description: e.title,
          amount: e.amount,
          receiptName: e.receipt?.fileName || "receipt.pdf",
          merchant: "Campus Vendor",
          addedBy: {
            name: e.createdBy?.name || "Authorized Reviewer",
            initials: initials || "AR",
          },
          status: e.status.toLowerCase() as "approved" | "pending" | "rejected",
          gstin: "27AABCT3518Q1ZV",
        };
      });

      return { claims, total: dbCount, page, limit };
    }
  } catch {
    // DB unmigrated or unavailable - fall through to runtime cache
  }

  let filtered = [...runtimeClaims];
  if (filters.category) {
    filtered = filtered.filter((c) => c.category === filters.category);
  }
  if (filters.status) {
    filtered = filtered.filter((c) => c.status.toLowerCase() === filters.status?.toLowerCase());
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.description.toLowerCase().includes(s) ||
        c.event.toLowerCase().includes(s) ||
        c.merchant.toLowerCase().includes(s) ||
        c.id.toLowerCase().includes(s)
    );
  }

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * limit, page * limit);
  return { claims: paginated, total, page, limit };
}

export async function createNewClaim(data: {
  eventId?: string;
  event?: string;
  category: string;
  description: string;
  amount: number;
  date?: string;
  receiptName?: string;
  merchant?: string;
  gstin?: string;
  userEmail?: string;
  userName?: string;
}) {
  const dbCategory = UI_TO_DB_CATEGORY[data.category] || ExpenseCategory.MISCELLANEOUS;
  const eventTitle = data.event || "ACM Hackathon 2026";
  let createdExpenseId = `CLM-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    let event = await prisma.event.findFirst({
      where: data.eventId ? { id: data.eventId } : { title: eventTitle },
    });
    if (!event && data.eventId) {
      event = await prisma.event.findUnique({ where: { id: data.eventId } });
    }

    let user = data.userEmail
      ? await prisma.user.findUnique({ where: { email: data.userEmail } })
      : null;
    if (!user) {
      user = await prisma.user.findFirst();
    }

    if (event && user) {
      let receiptId: string | undefined;
      if (data.receiptName) {
        const receipt = await prisma.receipt.create({
          data: {
            fileName: data.receiptName,
            fileUrl: `/uploads/${data.receiptName}`,
            fileSize: 1024 * 150,
            mimeType: data.receiptName.endsWith(".pdf") ? "application/pdf" : "image/png",
            storageProvider: "local",
          },
        });
        receiptId = receipt.id;
      }

      const expense = await prisma.expense.create({
        data: {
          eventId: event.id,
          title: data.description,
          amount: data.amount,
          category: dbCategory,
          status: ExpenseStatus.APPROVED,
          createdById: user.id,
          receiptId,
        },
      });
      createdExpenseId = expense.id;
    }
  } catch {
    // runtime fallback
  }

  const claimDate = data.date || new Date().toISOString().split("T")[0];
  const newClaim: ExpenseClaim = {
    id: createdExpenseId,
    date: claimDate,
    event: eventTitle,
    category: data.category as any,
    description: data.description,
    amount: data.amount,
    receiptName: data.receiptName || "CLAIM-RECEIPT.pdf",
    merchant: data.merchant || "Campus Vendor LLC",
    addedBy: {
      name: data.userName || "Rohan Varma",
      initials: (data.userName || "Rohan Varma")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    },
    status: "approved",
    gstin: data.gstin || "27AABCT3518Q1ZV",
  };

  runtimeClaims.unshift(newClaim);
  return newClaim;
}

export async function getClaimById(id: string) {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        createdBy: true,
        receipt: true,
        event: true,
      },
    });

    if (expense) {
      const initials = expense.createdBy?.name
        ? expense.createdBy.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "RV";

      return {
        id: expense.id,
        date: expense.createdAt.toISOString().split("T")[0],
        event: expense.event?.title || "Campus Event",
        category: (DB_TO_UI_CATEGORY[expense.category] || "Food & Catering") as any,
        description: expense.title,
        amount: expense.amount,
        receiptName: expense.receipt?.fileName || "receipt.pdf",
        merchant: "Campus Vendor",
        addedBy: {
          name: expense.createdBy?.name || "Rohan Varma",
          initials,
        },
        status: expense.status.toLowerCase() as "approved" | "pending" | "rejected",
        gstin: "27AABCT3518Q1ZV",
      };
    }
  } catch {
    // fallback
  }

  return runtimeClaims.find((c) => c.id === id) || null;
}

export async function updateClaimStatus(
  id: string,
  status: "approved" | "pending" | "rejected"
) {
  const dbStatus =
    status === "approved"
      ? ExpenseStatus.APPROVED
      : status === "rejected"
      ? ExpenseStatus.REJECTED
      : ExpenseStatus.PENDING;

  try {
    await prisma.expense.update({
      where: { id },
      data: { status: dbStatus },
    });
  } catch {
    // fallback
  }

  const idx = runtimeClaims.findIndex((c) => c.id === id);
  if (idx !== -1) {
    runtimeClaims[idx] = { ...runtimeClaims[idx], status };
    return runtimeClaims[idx];
  }
  return null;
}

export async function deleteClaimById(id: string) {
  try {
    await prisma.expense.delete({ where: { id } });
  } catch {
    // fallback
  }

  const initialLen = runtimeClaims.length;
  runtimeClaims = runtimeClaims.filter((c) => c.id !== id);
  return runtimeClaims.length < initialLen;
}

export async function getExpenseMetrics() {
  const { claims } = await listAllClaims({ limit: 100 });
  const totalDisbursed = claims.reduce((acc, c) => acc + c.amount, 0);
  const grantAllocation = MOCK_EXPENSE_METRICS.semesterGrantAllocation;
  const remainingLedger = grantAllocation - totalDisbursed;
  const fundUtilizationPercent =
    Math.round(((totalDisbursed / grantAllocation) * 100) * 10) / 10;
  const underForecastDelta = Math.max(0, 60000 - totalDisbursed);

  const fiscalGuardText = `${fundUtilizationPercent}% of semester budget used. Spending is ${
    fundUtilizationPercent > 80 ? "approaching ceiling limit" : "on track and within college limits"
  }.`;

  const now = new Date();
  const lastReconciledText = `Today, ${now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;

  return {
    semesterGrantAllocation: grantAllocation,
    totalDisbursed,
    claimsProcessedCount: claims.length,
    remainingLedger,
    underForecastDelta,
    fundUtilizationPercent,
    auditCapPercent: 80,
    auditCapAmount: Math.round(grantAllocation * 0.8),
    fiscalGuardText,
    lastReconciledText,
  };
}

export async function getCategoryCaps(): Promise<CategoryCap[]> {
  const { claims } = await listAllClaims({ limit: 100 });

  const spentByCategory: Record<string, number> = {};
  for (const c of claims) {
    spentByCategory[c.category] = (spentByCategory[c.category] || 0) + c.amount;
  }

  const categories = Object.keys(DEFAULT_CATEGORY_CAPS);
  return categories.map((catName) => {
    const cap = DEFAULT_CATEGORY_CAPS[catName];
    const spent = spentByCategory[catName] || 0;
    const ratio = spent / cap;

    let status: "nominal" | "near_cap" | "low_burn" = "nominal";
    if (ratio >= 0.7) status = "near_cap";
    else if (ratio <= 0.3) status = "low_burn";

    return {
      category: catName as any,
      cap,
      spent,
      status,
    };
  });
}

export async function getEventVarianceData(eventQuery?: string) {
  const { claims } = await listAllClaims({ limit: 100 });
  const eventClaims = claims.filter((c) =>
    eventQuery ? c.event.toLowerCase().includes(eventQuery.toLowerCase()) : c.event === "ACM Hackathon 2026"
  );

  const actualDisbursed = eventClaims.reduce((sum, c) => sum + c.amount, 0);
  const sanctioned = 18000;
  const varianceAmount = actualDisbursed - sanctioned;
  const variancePercent = Math.round(((varianceAmount / sanctioned) * 100) * 10) / 10;
  const efficiencyPercent = Math.min(100, Math.round((actualDisbursed / sanctioned) * 100));
  const registeredParticipants = 300;
  const participantCostRatio = Math.round((actualDisbursed / registeredParticipants) * 100) / 100;

  const lineItemsMap: Record<string, number> = {};
  for (const c of eventClaims) {
    lineItemsMap[c.category] = (lineItemsMap[c.category] || 0) + c.amount;
  }

  const lineItems: EventVarianceLineItem[] = [
    {
      name: "Catering",
      actual: lineItemsMap["Food & Catering"] || 8500,
      allocated: 9000,
      allocLabel: "9k",
    },
    {
      name: "Trophies & Medals",
      actual: lineItemsMap["Equipment & Hardware"] || 4200,
      allocated: 4500,
      allocLabel: "4.5k",
    },
    {
      name: "Swag & Badges",
      actual: lineItemsMap["Marketing & Swag"] || 2800,
      allocated: 3000,
      allocLabel: "3k",
    },
    {
      name: "Flex Banners",
      actual: lineItemsMap["Printing & Certificates"] || 1200,
      allocated: 1500,
      allocLabel: "1.5k",
    },
  ];

  return {
    eventCode: "ACM-HK-26",
    eventName: eventQuery || "ACM Hackathon 2026",
    sanctioned,
    disbursed: actualDisbursed > 0 ? actualDisbursed : 16700,
    efficiencyPercent: actualDisbursed > 0 ? efficiencyPercent : 92,
    varianceAmount: actualDisbursed > 0 ? varianceAmount : -1300,
    variancePercent: actualDisbursed > 0 ? variancePercent : -7.2,
    participantCostRatio: actualDisbursed > 0 ? participantCostRatio : 55.6,
    registeredParticipants,
    sacCeilingPerHead: 75.0,
    venueRoom: "Audi-3",
    geoReceiptsCount: eventClaims.length || 4,
    lineItems,
  };
}

export function formatClaimsToCSV(claims: ExpenseClaim[]): string {
  const headers = [
    "Claim ID",
    "Date",
    "Event",
    "Category",
    "Description",
    "Amount (INR)",
    "Merchant",
    "Added By",
    "Audit Status",
    "GSTIN",
  ];

  const rows = claims.map((c) => [
    c.id,
    c.date,
    `"${(c.event || "").replace(/"/g, '""')}"`,
    `"${c.category}"`,
    `"${(c.description || "").replace(/"/g, '""')}"`,
    c.amount,
    `"${(c.merchant || "").replace(/"/g, '""')}"`,
    `"${(c.addedBy?.name || "").replace(/"/g, '""')}"`,
    `"${c.status}"`,
    `"${c.gstin || "N/A"}"`,
  ]);

  return [headers.join(","), ...rows.map((e) => e.join(",")).join("\n")].join("\n");
}
