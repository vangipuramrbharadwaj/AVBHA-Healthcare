import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";
import type {
  CreateDoctorInput,
  DoctorListQuery,
  UpdateDoctorInput,
} from "./doctors.schema";

const doctorInclude = {
  employee: {
    select: {
      id: true,
      employeeCode: true,
      title: true,
      firstName: true,
      middleName: true,
      lastName: true,
      mobile: true,
      email: true,
      branchId: true,
      departmentId: true,
      status: true,
      branch: {
        select: {
          id: true,
          branchCode: true,
          branchName: true,
        },
      },
    },
  },
  department: {
    select: {
      id: true,
      departmentCode: true,
      departmentName: true,
    },
  },
} satisfies Prisma.DoctorInclude;

export async function listDoctors(
  hospitalId: string,
  query: DoctorListQuery,
) {
  const where: Prisma.DoctorWhereInput = {
    hospitalId,
    deletedAt: null,
    ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    ...(query.branchId
      ? {
          OR: [
            {
              employee: {
                branchId: query.branchId,
                deletedAt: null,
              },
            },
            {
              schedules: {
                some: {
                  branchId: query.branchId,
                  deletedAt: null,
                  status: "ACTIVE",
                },
              },
            },
          ],
        }
      : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { doctorCode: { contains: query.search, mode: "insensitive" } },
            {
              medicalRegistrationNumber: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            {
              specialization: {
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
              lastName: {
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
            {
              employee: {
                firstName: { contains: query.search, mode: "insensitive" },
              },
            },
            {
              employee: {
                lastName: { contains: query.search, mode: "insensitive" },
              },
            },
            {
              employee: {
                mobile: { contains: query.search, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      include: doctorInclude,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: [{ doctorCode: "asc" }],
    }),
    prisma.doctor.count({ where }),
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

export function findDoctor(hospitalId: string, id: string) {
  return prisma.doctor.findFirst({
    where: {
      id,
      hospitalId,
      deletedAt: null,
    },
    include: doctorInclude,
  });
}

export function findDepartment(
  hospitalId: string,
  departmentId: string,
) {
  return prisma.department.findFirst({
    where: {
      id: departmentId,
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
    },
    select: { id: true },
  });
}

export function findEmployeeForDoctor(
  hospitalId: string,
  employeeId: string,
) {
  return prisma.employee.findFirst({
    where: {
      id: employeeId,
      hospitalId,
      deletedAt: null,
      status: "ACTIVE",
    },
    select: {
      id: true,
      departmentId: true,
      doctor: {
        select: { id: true },
      },
    },
  });
}

export async function createDoctor(
  hospitalId: string,
  userId: string,
  input: CreateDoctorInput,
) {
  return prisma.$transaction(async (transaction) => {
    const doctor = await transaction.doctor.create({
      data: {
        hospitalId,
        employeeId: input.employeeId ?? null,
        departmentId: input.departmentId,

        title: input.title ?? null,
        firstName: input.firstName ?? null,
        middleName: input.middleName ?? null,
        lastName: input.lastName ?? null,
        mobile: input.mobile ?? null,
        email: input.email ?? null,

        doctorCode: input.doctorCode,
        medicalRegistrationNumber: input.medicalRegistrationNumber,
        registrationCouncil: input.registrationCouncil ?? null,
        qualification: input.qualification,
        specialization: input.specialization,
        consultationFee: input.consultationFee,
        followupFee: input.followupFee ?? null,
        emergencyFee: input.emergencyFee ?? null,
        averageConsultationMinutes: input.averageConsultationMinutes,
        isVisitingConsultant: input.isVisitingConsultant,
        status: input.status,
        createdBy: userId,
        updatedBy: userId,
      },
      include: doctorInclude,
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: "CREATE",
        module: "doctors",
        entityType: "Doctor",
        entityId: doctor.id,
        newValues: doctor,
      },
    });

    return doctor;
  });
}

export async function updateDoctor(
  hospitalId: string,
  userId: string,
  id: string,
  input: UpdateDoctorInput,
) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.doctor.findFirst({
      where: { id, hospitalId, deletedAt: null },
    });

    if (!existing) return null;

    const doctor = await transaction.doctor.update({
      where: { id },
      data: {
        ...(input.departmentId !== undefined
          ? { departmentId: input.departmentId }
          : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.firstName !== undefined
          ? { firstName: input.firstName }
          : {}),
        ...(input.middleName !== undefined
          ? { middleName: input.middleName }
          : {}),
        ...(input.lastName !== undefined
          ? { lastName: input.lastName }
          : {}),
        ...(input.mobile !== undefined ? { mobile: input.mobile } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.doctorCode !== undefined
          ? { doctorCode: input.doctorCode }
          : {}),
        ...(input.medicalRegistrationNumber !== undefined
          ? { medicalRegistrationNumber: input.medicalRegistrationNumber }
          : {}),
        ...(input.registrationCouncil !== undefined
          ? { registrationCouncil: input.registrationCouncil }
          : {}),
        ...(input.qualification !== undefined
          ? { qualification: input.qualification }
          : {}),
        ...(input.specialization !== undefined
          ? { specialization: input.specialization }
          : {}),
        ...(input.consultationFee !== undefined
          ? { consultationFee: input.consultationFee }
          : {}),
        ...(input.followupFee !== undefined
          ? { followupFee: input.followupFee }
          : {}),
        ...(input.emergencyFee !== undefined
          ? { emergencyFee: input.emergencyFee }
          : {}),
        ...(input.averageConsultationMinutes !== undefined
          ? {
              averageConsultationMinutes:
                input.averageConsultationMinutes,
            }
          : {}),
        ...(input.isVisitingConsultant !== undefined
          ? { isVisitingConsultant: input.isVisitingConsultant }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        updatedBy: userId,
      },
      include: doctorInclude,
    });

    await transaction.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: "UPDATE",
        module: "doctors",
        entityType: "Doctor",
        entityId: id,
        oldValues: existing,
        newValues: doctor,
      },
    });

    return doctor;
  });
}
