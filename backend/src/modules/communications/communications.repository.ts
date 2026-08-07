import {
  AuditAction,
  CommunicationChannel,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../../database/prisma";
import type {
  ListInput,
  NotificationListInput,
  PreferenceInput,
  TemplateInput,
  TemplateUpdateInput,
} from "./communications.schema";

export async function list(hospitalId: string, query: ListInput) {
  const where: Prisma.CommunicationMessageWhereInput = {
    hospitalId,
    ...(query.channel !== undefined ? { channel: query.channel } : {}),
    ...(query.status !== undefined ? { status: query.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.communicationMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.communicationMessage.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export function find(hospitalId: string, id: string) {
  return prisma.communicationMessage.findFirst({
    where: { hospitalId, id },
    include: {
      attempts: {
        orderBy: { attemptedAt: "desc" },
      },
    },
  });
}

export async function notifications(
  hospitalId: string,
  userId: string,
  query: NotificationListInput,
) {
  const where: Prisma.CommunicationMessageWhereInput = {
    hospitalId,
    recipientUserId: userId,
    channel: CommunicationChannel.IN_APP,
    ...(query.unreadOnly ? { readAt: null } : {}),
  };

  const [items, total, unread] = await Promise.all([
    prisma.communicationMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.communicationMessage.count({ where }),
    prisma.communicationMessage.count({
      where: {
        hospitalId,
        recipientUserId: userId,
        channel: CommunicationChannel.IN_APP,
        readAt: null,
      },
    }),
  ]);

  return {
    items,
    unread,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export function markRead(
  hospitalId: string,
  userId: string,
  id: string,
) {
  return prisma.communicationMessage.updateMany({
    where: {
      hospitalId,
      recipientUserId: userId,
      id,
      channel: CommunicationChannel.IN_APP,
    },
    data: { readAt: new Date() },
  });
}

export function markAllRead(
  hospitalId: string,
  userId: string,
) {
  return prisma.communicationMessage.updateMany({
    where: {
      hospitalId,
      recipientUserId: userId,
      channel: CommunicationChannel.IN_APP,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

export function templates(hospitalId: string) {
  return prisma.communicationTemplate.findMany({
    where: { hospitalId },
    orderBy: [{ code: "asc" }, { channel: "asc" }],
  });
}

export function templateByCode(
  hospitalId: string,
  code: string,
  channel: CommunicationChannel,
) {
  return prisma.communicationTemplate.findFirst({
    where: {
      hospitalId,
      code,
      channel,
      active: true,
    },
  });
}

export function createTemplate(
  hospitalId: string,
  userId: string,
  input: TemplateInput,
) {
  return prisma.$transaction(async (transaction) => {
    const data: Prisma.CommunicationTemplateUncheckedCreateInput = {
      hospitalId,
      code: input.code,
      name: input.name,
      channel: input.channel,
      bodyTemplate: input.bodyTemplate,
      active: input.active,
      createdBy: userId,
      updatedBy: userId,
    };

    if (input.subjectTemplate !== undefined) {
      data.subjectTemplate = input.subjectTemplate;
    }
    if (input.description !== undefined) {
      data.description = input.description;
    }

    const record = await transaction.communicationTemplate.create({
      data,
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.CREATE,
        module: "communications",
        entityType: "CommunicationTemplate",
        entityId: record.id,
        newValues: record,
      },
    });

    return record;
  });
}

export function updateTemplate(
  hospitalId: string,
  userId: string,
  id: string,
  input: TemplateUpdateInput,
) {
  return prisma.$transaction(async (transaction) => {
    const old = await transaction.communicationTemplate.findFirst({
      where: { hospitalId, id },
    });

    if (!old) {
      return null;
    }

    const data: Prisma.CommunicationTemplateUncheckedUpdateInput = {
      updatedBy: userId,
    };

    if (input.name !== undefined) data.name = input.name;
    if (input.channel !== undefined) data.channel = input.channel;
    if (input.subjectTemplate !== undefined) {
      data.subjectTemplate = input.subjectTemplate;
    }
    if (input.bodyTemplate !== undefined) {
      data.bodyTemplate = input.bodyTemplate;
    }
    if (input.description !== undefined) {
      data.description = input.description;
    }
    if (input.active !== undefined) data.active = input.active;

    const record = await transaction.communicationTemplate.update({
      where: { id },
      data,
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.UPDATE,
        module: "communications",
        entityType: "CommunicationTemplate",
        entityId: id,
        oldValues: old,
        newValues: record,
      },
    });

    return record;
  });
}

export function createMessage(
  data: Prisma.CommunicationMessageUncheckedCreateInput,
) {
  return prisma.communicationMessage.create({ data });
}

export function preference(
  hospitalId: string,
  userId: string,
  channel: CommunicationChannel,
  eventType: string,
) {
  return prisma.communicationPreference.findUnique({
    where: {
      hospitalId_userId_channel_eventType: {
        hospitalId,
        userId,
        channel,
        eventType,
      },
    },
  });
}

export function preferences(
  hospitalId: string,
  userId: string,
) {
  return prisma.communicationPreference.findMany({
    where: { hospitalId, userId },
    orderBy: [{ eventType: "asc" }, { channel: "asc" }],
  });
}

export function savePreference(
  hospitalId: string,
  userId: string,
  input: PreferenceInput,
) {
  return prisma.communicationPreference.upsert({
    where: {
      hospitalId_userId_channel_eventType: {
        hospitalId,
        userId,
        channel: input.channel,
        eventType: input.eventType,
      },
    },
    create: {
      hospitalId,
      userId,
      channel: input.channel,
      eventType: input.eventType,
      enabled: input.enabled,
    },
    update: {
      enabled: input.enabled,
    },
  });
}
