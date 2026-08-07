import {
  CommunicationChannel,
  CommunicationStatus,
  type Prisma,
} from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import * as repository from "./communications.repository";
import type {
  ListInput,
  NotificationListInput,
  PreferenceInput,
  SendInput,
  TemplateInput,
  TemplateUpdateInput,
} from "./communications.schema";

function renderTemplate(
  template: string,
  variables: Record<string, string | number | boolean | null>,
): string {
  return template.replace(
    /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g,
    (_match, key: string) => {
      const value = variables[key];
      return value === undefined || value === null
        ? ""
        : String(value);
    },
  );
}

export const list = repository.list;
export const notifications = repository.notifications;
export const templates = repository.templates;
export const preferences = repository.preferences;

export async function get(hospitalId: string, id: string) {
  const record = await repository.find(hospitalId, id);

  if (!record) {
    throw new AppError(
      "Communication was not found",
      404,
      "COMMUNICATION_NOT_FOUND",
    );
  }

  return record;
}

export async function markRead(
  hospitalId: string,
  userId: string,
  id: string,
) {
  const result = await repository.markRead(
    hospitalId,
    userId,
    id,
  );

  if (result.count === 0) {
    throw new AppError(
      "Notification was not found",
      404,
      "NOTIFICATION_NOT_FOUND",
    );
  }

  return { id, read: true };
}

export async function markAllRead(
  hospitalId: string,
  userId: string,
) {
  const result = await repository.markAllRead(
    hospitalId,
    userId,
  );

  return { updated: result.count };
}

export function createTemplate(
  hospitalId: string,
  userId: string,
  input: TemplateInput,
) {
  return repository.createTemplate(
    hospitalId,
    userId,
    input,
  );
}

export async function updateTemplate(
  hospitalId: string,
  userId: string,
  id: string,
  input: TemplateUpdateInput,
) {
  const record = await repository.updateTemplate(
    hospitalId,
    userId,
    id,
    input,
  );

  if (!record) {
    throw new AppError(
      "Communication template was not found",
      404,
      "COMMUNICATION_TEMPLATE_NOT_FOUND",
    );
  }

  return record;
}

export function setPreference(
  hospitalId: string,
  userId: string,
  input: PreferenceInput,
) {
  return repository.savePreference(
    hospitalId,
    userId,
    input,
  );
}

export async function send(
  hospitalId: string,
  userId: string,
  input: SendInput,
) {
  if (input.recipientUserId && input.eventType) {
    const preference = await repository.preference(
      hospitalId,
      input.recipientUserId,
      input.channel,
      input.eventType,
    );

    if (preference && !preference.enabled) {
      throw new AppError(
        "Recipient disabled this communication channel for the event",
        409,
        "COMMUNICATION_PREFERENCE_DISABLED",
      );
    }
  }

  let body = input.body ?? "";
  let subject = input.subject ?? null;
  let templateId: string | undefined;

  if (input.templateCode) {
    const template = await repository.templateByCode(
      hospitalId,
      input.templateCode.toUpperCase(),
      input.channel,
    );

    if (!template) {
      throw new AppError(
        "Communication template was not found",
        404,
        "COMMUNICATION_TEMPLATE_NOT_FOUND",
      );
    }

    templateId = template.id;
    body = renderTemplate(
      template.bodyTemplate,
      input.variables,
    );

    if (template.subjectTemplate) {
      subject = renderTemplate(
        template.subjectTemplate,
        input.variables,
      );
    }
  }

  if (!body) {
    throw new AppError(
      "Communication body is required",
      400,
      "COMMUNICATION_BODY_REQUIRED",
    );
  }

  const isScheduled =
    input.scheduledAt !== undefined &&
    input.scheduledAt !== null &&
    input.scheduledAt.getTime() > Date.now();

  if (
    input.channel !== CommunicationChannel.IN_APP &&
    !isScheduled
  ) {
    throw new AppError(
      `${input.channel} provider is not configured`,
      503,
      "COMMUNICATION_PROVIDER_NOT_CONFIGURED",
    );
  }

  const data: Prisma.CommunicationMessageUncheckedCreateInput = {
    hospitalId,
    createdBy: userId,
    channel: input.channel,
    status: isScheduled
      ? CommunicationStatus.SCHEDULED
      : CommunicationStatus.DELIVERED,
    priority: input.priority,
    body,
    variables: input.variables,
  };

  if (input.recipientUserId !== undefined) {
    data.recipientUserId = input.recipientUserId;
  }
  if (input.recipientAddress !== undefined) {
    data.recipientAddress = input.recipientAddress;
  }
  if (subject !== undefined) {
    data.subject = subject;
  }
  if (templateId !== undefined) {
    data.templateId = templateId;
  }
  if (input.scheduledAt !== undefined) {
    data.scheduledAt = input.scheduledAt;
  }
  if (input.eventType !== undefined) {
    data.eventType = input.eventType;
  }
  if (input.entityType !== undefined) {
    data.entityType = input.entityType;
  }
  if (input.entityId !== undefined) {
    data.entityId = input.entityId;
  }
  if (input.idempotencyKey !== undefined) {
    data.idempotencyKey = input.idempotencyKey;
  }
  if (!isScheduled) {
    data.deliveredAt = new Date();
  }

  return repository.createMessage(data);
}
