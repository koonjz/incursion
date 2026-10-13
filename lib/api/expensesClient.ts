import type { CategoryCap, ExpenseClaim } from "@/lib/types/expenses";

export async function fetchClaims(filters?: {
  category?: string;
  status?: string;
  search?: string;
}): Promise<ExpenseClaim[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.category) params.set("category", filters.category);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.search) params.set("search", filters.search);

    const res = await fetch(`/api/expenses/claims?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch claims");
    const data = await res.json();
    return data.claims || [];
  } catch (e) {
    console.warn("fetchClaims network error:", e);
    return [];
  }
}

export async function createExpenseClaim(claimData: {
  event: string;
  category: string;
  amount: number;
  description: string;
  merchant?: string;
  date?: string;
  receiptName?: string;
  gstin?: string;
}): Promise<ExpenseClaim> {
  const res = await fetch("/api/expenses/claims", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(claimData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create claim");
  }
  const data = await res.json();
  return data.claim;
}

export async function fetchExpenseMetrics() {
  const res = await fetch("/api/expenses/metrics");
  if (!res.ok) throw new Error("Failed to fetch expense metrics");
  const data = await res.json();
  return data.metrics;
}

export async function fetchCategoryCaps(): Promise<CategoryCap[]> {
  const res = await fetch("/api/expenses/category-caps");
  if (!res.ok) throw new Error("Failed to fetch category caps");
  const data = await res.json();
  return data.categories;
}

export async function fetchEventVariance(eventQuery?: string) {
  const url = eventQuery
    ? `/api/expenses/event-variance?event=${encodeURIComponent(eventQuery)}`
    : "/api/expenses/event-variance";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch event variance");
  const data = await res.json();
  return data.variance;
}
