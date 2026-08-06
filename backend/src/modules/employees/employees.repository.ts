import {
  AuditAction,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../database/prisma";
import type {
  CreateEmployeeDocumentInput,
  CreateEmployeeInput,
  EmployeeListQuery,
  UpdateEmployeeDocumentInput,
  UpdateEmployeeInput,
  UpdateEmployeeStatusInput,
} from "./employees.schema";

function toAuditJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value, (_key, currentValue) => {
      if (typeof currentValue === "bigint") {
        return currentValue.toString();
      }

      if (currentValue instanceof Prisma.Decimal) {
        return currentValue.toString();
      }

      if (currentValue instanceof Date) {
        return currentValue.toISOString();
      }

      return currentValue;
    }),
  ) as Prisma.InputJsonValue;
}

export async function listEmployees(
  hospitalId: string,
  query: EmployeeListQuery,
) {
  const where: Prisma.EmployeeWhereInput = {
    hospitalId,
    deletedAt: null,
    ...(query.branchId ? { branchId: query.branchId } : {}),
    ...(query.departmentId
      ? { departmentId: query.departmentId }
      : {}),
    ...(query.designationId
      ? { designationId: query.designationId }
      : {}),
    ...(query.reportingManagerId
      ? { reportingManagerId: query.reportingManagerId }
      : {}),
    ...(query.employmentType
      ? { employmentType: query.employmentType }
      : {}),
    ...(query.gender ? { gender: query.gender } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            {
              employeeCode: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            {
              firstName: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            {
              middleName: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            {
              lastName: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            {
              mobile: {
                contains: query.search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            branchCode: true,
            branchName: true,
          },
        },
        department: {
          select: {
            id: true,
            departmentCode: true,
            departmentName: true,
          },
        },
        designation: {
          select: {
            id: true,
            designationCode: true,
            designationName: true,
          },
        },
        reportingManager: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            middleName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            documents: true,
            directReports: true,
          },
        },
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
    }),
    prisma.employee.count({ where }),
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

export function findEmployee(
  hospitalId: string,
  id: string,
) {
  return prisma.employee.findFirst({
    where: {
      id,
      hospitalId,
      deletedAt: null,
    },
    include: {
      hospital: {
        select: {
          id: true,
          hospitalCode: true,
          displayName: true,
        },
      },
      branch: true,
      department: true,
      designation: true,
      reportingManager: {
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          middleName: true,
          lastName: true,
        },
      },
      directReports: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          middleName: true,
          lastName: true,
          status: true,
        },
        orderBy: {
          firstName: "asc",
        },
      },
      doctor: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          status: true,
        },
      },
      documents: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export function findEmployeeBasic(
  hospitalId: string,
  id: string,
) {
  return prisma.employee.findFirst({
    where: {
      id,
      hospitalId,
      deletedAt: null,
    },
  });
}

export function branchExists(
  hospitalId: string,
  branchId: string,
) {
  return prisma.hospitalBranch.count({
    where: {
      id: branchId,
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
    },
  });
}

export function departmentExists(
  hospitalId: string,
  departmentId: string,
) {
  return prisma.department.count({
    where: {
      id: departmentId,
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
    },
  });
}

export function designationExists(
  hospitalId: string,
  designationId: string,
) {
  return prisma.designation.count({
    where: {
      id: designationId,
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
    },
  });
}

export function reportingManagerExists(
  hospitalId: string,
  reportingManagerId: string,
) {
  return prisma.employee.count({
    where: {
      id: reportingManagerId,
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
    },
  });
}

function buildEmployeeCreateData(
  hospitalId: string,
  userId: string,
  input: CreateEmployeeInput,
): Prisma.EmployeeUncheckedCreateInput {
  const data: Prisma.EmployeeUncheckedCreateInput = {
    hospitalId,
    departmentId: input.departmentId,
    designationId: input.designationId,
    employeeCode: input.employeeCode,
    firstName: input.firstName,
    mobile: input.mobile,
    employmentType: input.employmentType,
    joiningDate: input.joiningDate,
    status: input.status,
    createdBy: userId,
    updatedBy: userId,
  };

  for (const [key, value] of Object.entries(input)) {
    if (
      value === undefined ||
      key === "basicSalary" ||
      key === "employeeCode" ||
      key === "departmentId" ||
      key === "designationId" ||
      key === "firstName" ||
      key === "mobile" ||
      key === "employmentType" ||
      key === "joiningDate" ||
      key === "status"
    ) {
      continue;
    }

    (data as Record<string, unknown>)[key] = value;
  }

  if (input.basicSalary !== undefined) {
    data.basicSalary =
      input.basicSalary === null
        ? null
        : new Prisma.Decimal(input.basicSalary);
  }

  return data;
}

function buildEmployeeUpdateData(
  userId: string,
  input: UpdateEmployeeInput,
): Prisma.EmployeeUncheckedUpdateInput {
  const data: Prisma.EmployeeUncheckedUpdateInput = {
    updatedBy: userId,
  };

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || key === "basicSalary") {
      continue;
    }

    (data as Record<string, unknown>)[key] = value;
  }

  if (input.basicSalary !== undefined) {
    data.basicSalary =
      input.basicSalary === null
        ? null
        : new Prisma.Decimal(input.basicSalary);
  }

  return data;
}

export function createEmployee(
  hospitalId: string,
  userId: string,
  input: CreateEmployeeInput,
) {
  return prisma.$transaction(async (transaction) => {
    const employee = await transaction.employee.create({
      data: buildEmployeeCreateData(
        hospitalId,
        userId,
        input,
      ),
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.CREATE,
        module: "employees",
        entityType: "Employee",
        entityId: employee.id,
        newValues: toAuditJson(employee),
      },
    });

    return employee;
  });
}

export function updateEmployee(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateEmployeeInput,
) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.employee.findFirst({
      where: {
        id,
        hospitalId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return null;
    }

    const employee = await transaction.employee.update({
      where: { id },
      data: buildEmployeeUpdateData(userId, input),
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.UPDATE,
        module: "employees",
        entityType: "Employee",
        entityId: id,
        oldValues: toAuditJson(existing),
        newValues: toAuditJson(employee),
      },
    });

    return employee;
  });
}

export function updateEmployeeStatus(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateEmployeeStatusInput,
) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.employee.findFirst({
      where: {
        id,
        hospitalId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return null;
    }

    const employee = await transaction.employee.update({
      where: { id },
      data: {
        status: input.status,
        updatedBy: userId,
      },
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.UPDATE,
        module: "employees",
        entityType: "Employee",
        entityId: id,
        oldValues: toAuditJson(existing),
        newValues: toAuditJson(employee),
      },
    });

    return employee;
  });
}

export function listEmployeeDocuments(
  hospitalId: string,
  employeeId: string,
) {
  return prisma.employeeDocument.findMany({
    where: {
      hospitalId,
      employeeId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

function buildDocumentCreateData(
  hospitalId: string,
  employeeId: string,
  userId: string,
  input: CreateEmployeeDocumentInput,
): Prisma.EmployeeDocumentUncheckedCreateInput {
  const data: Prisma.EmployeeDocumentUncheckedCreateInput = {
    hospitalId,
    employeeId,
    documentType: input.documentType,
    documentName: input.documentName,
    filePath: input.filePath,
    verified: input.verified,
    createdBy: userId,
  };

  if (input.mimeType !== undefined) {
    data.mimeType = input.mimeType;
  }
  if (input.fileSize !== undefined) {
    data.fileSize = input.fileSize;
  }
  if (input.documentDate !== undefined) {
    data.documentDate = input.documentDate;
  }
  if (input.expiryDate !== undefined) {
    data.expiryDate = input.expiryDate;
  }

  return data;
}

function buildDocumentUpdateData(
  input: UpdateEmployeeDocumentInput,
): Prisma.EmployeeDocumentUncheckedUpdateInput {
  const data: Prisma.EmployeeDocumentUncheckedUpdateInput = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      (data as Record<string, unknown>)[key] = value;
    }
  }

  return data;
}

export function createEmployeeDocument(
  hospitalId: string,
  employeeId: string,
  userId: string,
  input: CreateEmployeeDocumentInput,
) {
  return prisma.$transaction(async (transaction) => {
    const document =
      await transaction.employeeDocument.create({
        data: buildDocumentCreateData(
          hospitalId,
          employeeId,
          userId,
          input,
        ),
      });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.CREATE,
        module: "employees",
        entityType: "EmployeeDocument",
        entityId: document.id,
        newValues: toAuditJson(document),
      },
    });

    return document;
  });
}

export function updateEmployeeDocument(
  hospitalId: string,
  employeeId: string,
  documentId: string,
  userId: string,
  input: UpdateEmployeeDocumentInput,
) {
  return prisma.$transaction(async (transaction) => {
    const existing =
      await transaction.employeeDocument.findFirst({
        where: {
          id: documentId,
          hospitalId,
          employeeId,
        },
      });

    if (!existing) {
      return null;
    }

    const document =
      await transaction.employeeDocument.update({
        where: { id: documentId },
        data: buildDocumentUpdateData(input),
      });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.UPDATE,
        module: "employees",
        entityType: "EmployeeDocument",
        entityId: documentId,
        oldValues: toAuditJson(existing),
        newValues: toAuditJson(document),
      },
    });

    return document;
  });
}

export function deleteEmployeeDocument(
  hospitalId: string,
  employeeId: string,
  documentId: string,
  userId: string,
) {
  return prisma.$transaction(async (transaction) => {
    const existing =
      await transaction.employeeDocument.findFirst({
        where: {
          id: documentId,
          hospitalId,
          employeeId,
        },
      });

    if (!existing) {
      return null;
    }

    await transaction.employeeDocument.delete({
      where: { id: documentId },
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: AuditAction.DELETE,
        module: "employees",
        entityType: "EmployeeDocument",
        entityId: documentId,
        oldValues: toAuditJson(existing),
      },
    });

    return existing;
  });
}
