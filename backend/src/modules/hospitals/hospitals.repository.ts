import { AuditAction, type Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";
import type { UpdateHospitalInput } from "./hospitals.schema";

export function findHospitalProfile(hospitalId: string) {
  return prisma.hospital.findFirst({
    where: {
      id: hospitalId,
      active: true,
      deletedAt: null,
    },
    include: {
      branches: {
        where: {
          deletedAt: null,
        },
        orderBy: [
          { isMainBranch: "desc" },
          { branchName: "asc" },
        ],
      },
      _count: {
        select: {
          branches: true,
          departments: true,
          employees: true,
          doctors: true,
          users: true,
        },
      },
    },
  });
}

function buildHospitalUpdateData(
  userId: string,
  input: UpdateHospitalInput,
): Prisma.HospitalUncheckedUpdateInput {
  const data: Prisma.HospitalUncheckedUpdateInput = {
    updatedBy: userId,
  };

  if (input.legalName !== undefined) {
    data.legalName = input.legalName;
  }
  if (input.displayName !== undefined) {
    data.displayName = input.displayName;
  }
  if (input.registrationNumber !== undefined) {
    data.registrationNumber = input.registrationNumber;
  }
  if (input.gstin !== undefined) {
    data.gstin = input.gstin;
  }
  if (input.pan !== undefined) {
    data.pan = input.pan;
  }
  if (input.email !== undefined) {
    data.email = input.email;
  }
  if (input.phone !== undefined) {
    data.phone = input.phone;
  }
  if (input.alternatePhone !== undefined) {
    data.alternatePhone = input.alternatePhone;
  }
  if (input.addressLine1 !== undefined) {
    data.addressLine1 = input.addressLine1;
  }
  if (input.addressLine2 !== undefined) {
    data.addressLine2 = input.addressLine2;
  }
  if (input.city !== undefined) {
    data.city = input.city;
  }
  if (input.state !== undefined) {
    data.state = input.state;
  }
  if (input.country !== undefined) {
    data.country = input.country;
  }
  if (input.postalCode !== undefined) {
    data.postalCode = input.postalCode;
  }
  if (input.timezone !== undefined) {
    data.timezone = input.timezone;
  }
  if (input.currencyCode !== undefined) {
    data.currencyCode = input.currencyCode;
  }
  if (input.logoPath !== undefined) {
    data.logoPath = input.logoPath;
  }
  if (input.licenseExpiryDate !== undefined) {
    data.licenseExpiryDate = input.licenseExpiryDate;
  }

  return data;
}

export function updateHospitalProfile(
  hospitalId: string,
  userId: string,
  input: UpdateHospitalInput,
) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.hospital.findFirst({
      where: {
        id: hospitalId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return null;
    }

    const updated = await transaction.hospital.update({
      where: { id: hospitalId },
      data: buildHospitalUpdateData(userId, input),
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.UPDATE,
        module: "hospitals",
        entityType: "Hospital",
        entityId: hospitalId,
        oldValues: existing,
        newValues: updated,
      },
    });

    return updated;
  });
}
