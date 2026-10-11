import { z } from "zod";

export const expenseCategoryEnum = z.enum([
  "VENUE",
  "EQUIPMENT",
  "CATERING",
  "MARKETING",
  "TRAVEL",
  "PRIZES",
  "MISCELLANEOUS",
]);

export const createExpenseSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  amount: z.number().positive("Amount must be greater than 0"),
  category: expenseCategoryEnum,
  receiptId: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  amount: z.number().positive().optional(),
  category: expenseCategoryEnum.optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  receiptId: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
