import { z } from "zod";

export const queueEntryIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const queueIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const queueActionNotesSchema = z.object({
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const queueDashboardQuerySchema = z.object({
  queueId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  date: z.coerce.date().optional(),
});
