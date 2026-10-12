import { z } from "zod";
import { isAfter, parseISO } from "date-fns";

export const USER_ROLES = ["ADMIN", "HOD", "ORGANIZER", "STUDENT"] as const;

// -----------------------------------------------------------------------------
// User Management Schemas
// -----------------------------------------------------------------------------

export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional().default(""),
  role: z.enum(["ALL", ...USER_ROLES]).optional().default("ALL"),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).optional().default("ALL"),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(USER_ROLES),
});

export const toggleUserStatusSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  isActive: z.boolean(),
});

// -----------------------------------------------------------------------------
// Semester Management Schemas
// -----------------------------------------------------------------------------

export const createSemesterSchema = z
  .object({
    name: z.string().min(2, "Semester name must be at least 2 characters").max(50),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date format"),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date format"),
    isActive: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const start = parseISO(data.startDate);
      const end = parseISO(data.endDate);
      return isAfter(end, start);
    },
    {
      message: "End date must be strictly after the start date",
      path: ["endDate"],
    }
  );

export const updateSemesterSchema = z
  .object({
    name: z.string().min(2).max(50).optional(),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date").optional(),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date").optional(),
    isActive: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return isAfter(parseISO(data.endDate), parseISO(data.startDate));
      }
      return true;
    },
    {
      message: "End date must be strictly after the start date",
      path: ["endDate"],
    }
  );

// -----------------------------------------------------------------------------
// Department Budget Schemas
// -----------------------------------------------------------------------------

export const createDepartmentBudgetSchema = z
  .object({
    semesterId: z.string().min(1, "Semester is required"),
    department: z.string().min(2, "Department/Club name must be at least 2 characters").max(80),
    allocated: z.coerce.number().min(0, "Allocated budget cannot be negative"),
    spent: z.coerce.number().min(0, "Spent budget cannot be negative").default(0),
    currency: z.string().min(1).max(10).default("USD"),
    adminOverride: z.boolean().default(false),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (!data.adminOverride) {
        return data.spent <= data.allocated;
      }
      return true;
    },
    {
      message: "Spent amount cannot exceed allocated amount without admin override flag",
      path: ["spent"],
    }
  );

export const updateDepartmentBudgetSchema = z
  .object({
    allocated: z.coerce.number().min(0).optional(),
    spent: z.coerce.number().min(0).optional(),
    currency: z.string().max(10).optional(),
    adminOverride: z.boolean().optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.allocated !== undefined && data.spent !== undefined && !data.adminOverride) {
        return data.spent <= data.allocated;
      }
      return true;
    },
    {
      message: "Spent amount cannot exceed allocated amount without admin override flag",
      path: ["spent"],
    }
  );
