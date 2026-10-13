export type ExpenseCategory =
  | "Food & Catering"
  | "Equipment & Hardware"
  | "Marketing & Swag"
  | "Transportation"
  | "Venue & Audio"
  | "Printing & Certificates";

export type AuditStatus = "approved" | "pending" | "rejected";

export interface ExpenseClaim {
  id: string;
  date: string;
  event: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  receiptName: string;
  merchant: string;
  addedBy: {
    name: string;
    initials: string;
  };
  status: AuditStatus;
  gstin?: string;
}

export interface CategoryCap {
  category: ExpenseCategory;
  cap: number;
  spent: number;
  status: "nominal" | "near_cap" | "low_burn";
}

export interface EventVarianceLineItem {
  name: string;
  actual: number;
  allocated: number;
  allocLabel: string;
}
