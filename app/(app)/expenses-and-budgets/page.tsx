import React from "react";
import { Metadata } from "next";
import { ExpensesBudgetView } from "@/components/expenses/ExpensesBudgetView";

export const metadata: Metadata = {
  title: "Expenses & Budget Management | ACM Resolve",
  description:
    "Semester financial governance, departmental allocations, and itemized audit trail.",
};

export default function ExpensesAndBudgetsPage() {
  return <ExpensesBudgetView />;
}
