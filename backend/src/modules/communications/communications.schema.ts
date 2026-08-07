import {
  CommunicationChannel,
  CommunicationPriority,
  CommunicationStatus,
} from "@prisma/client";
import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  channel: z.nativeEnum(CommunicationChannel).optional(),
  status: z.nativeEnum(CommunicationStatus).optional(),
});

export const notificationListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().default(false),
});

export const templateSchema = z.object({
  code: z.string().trim().min(2).max(80).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(150),
  channel: z.nativeEnum(CommunicationChannel),
  subjectTemplate: z.string().trim().max(250).optional().nullable(),
  bodyTemplate: z.string().trim().min(1).max(20000),
  description: z.string().trim().max(1000).optional().nullable(),
  active: z.boolean().default(true),
});

export const templateUpdateSchema = templateSchema
  .omit({ code: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const sendSchema = z
  .object({
    channel: z.nativeEnum(CommunicationChannel),
    templateCode: z.string().trim().max(80).optional(),
    recipientUserId: z.string().uuid().optional(),
    recipientAddress: z.string().trim().min(1).max(320).optional(),
    subject: z.string().trim().max(250).optional().nullable(),
    body: z.string().trim().max(20000).optional(),
    variables: z
      .record(
        z.string(),
        z.union([z.string(), z.number(), z.boolean(), z.null()]),
      )
      .default({}),
    priority: z
      .nativeEnum(CommunicationPriority)
      .default(CommunicationPriority.NORMAL),
    scheduledAt: z.coerce.date().optional().nullable(),
    eventType: z.string().trim().max(100).optional(),
    entityType: z.string().trim().max(100).optional(),
    entityId: z.string().trim().max(100).optional(),
    idempotencyKey: z.string().trim().max(120).optional(),
  })
  .superRefine((value, context) => {
    if (!value.recipientUserId && !value.recipientAddress) {
      context.addIssue({
        code: "custom",
        message: "recipientUserId or recipientAddress is required",
      });
    }

    if (!value.templateCode && !value.body) {
      context.addIssue({
        code: "custom",
        message: "templateCode or body is required",
      });
    }
  });

export const preferenceSchema = z.object({
  channel: z.nativeEnum(CommunicationChannel),
  eventType: z.string().trim().min(1).max(100),
  enabled: z.boolean(),
});

export type ListInput = z.infer<typeof listSchema>;
export type NotificationListInput = z.infer<typeof notificationListSchema>;
export type TemplateInput = z.infer<typeof templateSchema>;
export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>;
export type SendInput = z.infer<typeof sendSchema>;
export type PreferenceInput = z.infer<typeof preferenceSchema>;
