import { z } from "zod";

export const eventResourceInputSchema = z.object({
  resourceId: z.string().min(1, "Resource ID is required"),
  quantity: z.number().int().positive().default(1),
});

export const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().max(2000).optional(),
  eventType: z.string().min(1, "Event type is required"),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid startTime format",
  }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid endTime format",
  }),
  venueId: z.string().min(1, "Venue ID is required"),
  expectedAttendance: z.number().int().nonnegative().default(0),
  attendeesGroup: z.array(z.string()).default([]),
  resources: z.array(eventResourceInputSchema).optional().default([]),
  budgetAllocated: z.number().nonnegative().optional().default(0),
  overrideConflict: z.boolean().optional().default(false),
  overrideReason: z.string().optional(),
}).refine(
  (data) => new Date(data.startTime) < new Date(data.endTime),
  {
    message: "startTime must be before endTime",
    path: ["endTime"],
  }
);

export const updateEventSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().max(2000).optional(),
  eventType: z.string().optional(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid startTime format",
  }).optional(),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid endTime format",
  }).optional(),
  venueId: z.string().optional(),
  expectedAttendance: z.number().int().nonnegative().optional(),
  attendeesGroup: z.array(z.string()).optional(),
  resources: z.array(eventResourceInputSchema).optional(),
  overrideConflict: z.boolean().optional(),
  overrideReason: z.string().optional(),
});

export const reviewEventSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "CHANGES_REQUESTED"]),
  comment: z.string().max(1000).optional(),
  changesRequested: z.array(z.string()).optional().default([]),
  overrideConflict: z.boolean().optional().default(false),
});

export const checkConflictsSchema = z.object({
  id: z.string().optional(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid startTime format",
  }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid endTime format",
  }),
  venueId: z.string().min(1, "Venue ID is required"),
  organizerId: z.string().optional(),
  resources: z.array(eventResourceInputSchema).optional().default([]),
  attendeesGroup: z.array(z.string()).optional().default([]),
  durationMinutes: z.number().int().positive().optional(),
}).refine(
  (data) => new Date(data.startTime) < new Date(data.endTime),
  {
    message: "startTime must be before endTime",
    path: ["endTime"],
  }
);

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ReviewEventInput = z.infer<typeof reviewEventSchema>;
export type CheckConflictsInput = z.infer<typeof checkConflictsSchema>;
