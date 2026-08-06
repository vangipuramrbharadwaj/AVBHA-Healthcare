import {
  QueueEntryStatus,
  QueuePriority,
  QueueSource,
  QueueStatus,
} from "@prisma/client";
import { z } from "zod";

export const queueIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createQueueSchema = z.object({
  branchId: z.string().uuid(),
  departmentId: z.string().uuid(),
  doctorId: z.string().uuid(),
  queueDate: z.coerce.date(),
  queueCode: z.string().trim().min(2).max(30),
  tokenPrefix: z.string().trim().min(1).max(10).default("A"),
});

export const createQueueEntrySchema = z.object({
  queueId: z.string().uuid(),
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional().nullable(),
  priority: z.nativeEnum(QueuePriority).default(QueuePriority.NORMAL),
  source: z.nativeEnum(QueueSource).default(QueueSource.APPOINTMENT),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const listQueuesQuerySchema = z.object({
  doctorId: z.string().uuid().optional(),
  date: z.coerce.date().optional(),
  status: z.nativeEnum(QueueStatus).optional(),
});

export const listQueueEntriesQuerySchema = z.object({
  queueId: z.string().uuid().optional(),
  status: z.nativeEnum(QueueEntryStatus).optional(),
  priority: z.nativeEnum(QueuePriority).optional(),
});
