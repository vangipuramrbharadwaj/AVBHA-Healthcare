import { Prisma, RecordStatus } from "@prisma/client";

const departments = [
  {
    code: "GEN",
    name: "General Medicine",
    type: "CLINICAL",
    description: "General Medicine Department",
  },
  {
    code: "CAR",
    name: "Cardiology",
    type: "CLINICAL",
    description: "Cardiology Department",
  },
  {
    code: "NEU",
    name: "Neurology",
    type: "CLINICAL",
    description: "Neurology Department",
  },
  {
    code: "ORT",
    name: "Orthopaedics",
    type: "CLINICAL",
    description: "Orthopaedics Department",
  },
  {
    code: "ENT",
    name: "ENT",
    type: "CLINICAL",
    description: "Ear Nose Throat Department",
  },
  {
    code: "DER",
    name: "Dermatology",
    type: "CLINICAL",
    description: "Dermatology Department",
  },
  {
    code: "PED",
    name: "Pediatrics",
    type: "CLINICAL",
    description: "Pediatrics Department",
  },
  {
    code: "OBS",
    name: "Obstetrics & Gynaecology",
    type: "CLINICAL",
    description: "Obstetrics and Gynaecology",
  },
  {
    code: "EMR",
    name: "Emergency",
    type: "EMERGENCY",
    description: "Emergency Department",
  },
  {
    code: "ICU",
    name: "Intensive Care Unit",
    type: "CRITICAL",
    description: "ICU",
  },
  {
    code: "LAB",
    name: "Laboratory",
    type: "DIAGNOSTIC",
    description: "Clinical Laboratory",
  },
  {
    code: "RAD",
    name: "Radiology",
    type: "DIAGNOSTIC",
    description: "Radiology Department",
  },
  {
    code: "PHA",
    name: "Pharmacy",
    type: "SUPPORT",
    description: "Hospital Pharmacy",
  },
  {
    code: "BIL",
    name: "Billing",
    type: "ADMIN",
    description: "Billing Department",
  },
  {
    code: "OT",
    name: "Operation Theatre",
    type: "SURGICAL",
    description: "Operation Theatre",
  },
  {
    code: "PHY",
    name: "Physiotherapy",
    type: "CLINICAL",
    description: "Physiotherapy Department",
  },
  {
    code: "DIA",
    name: "Dialysis",
    type: "CLINICAL",
    description: "Dialysis Unit",
  },
  {
    code: "ADM",
    name: "Administration",
    type: "ADMIN",
    description: "Hospital Administration",
  },
];

export async function seedDepartments(
  tx: Prisma.TransactionClient,
  hospitalId: string,
  branchId: string,
): Promise<void> {
  for (const department of departments) {
    await tx.department.upsert({
      where: {
        hospitalId_departmentCode: {
          hospitalId,
          departmentCode: department.code,
        },
      },

      update: {
        departmentName: department.name,
        departmentType: department.type,
        description: department.description,
        branchId,
        status: RecordStatus.ACTIVE,
        deletedAt: null,
      },

      create: {
        hospitalId,
        branchId,
        departmentCode: department.code,
        departmentName: department.name,
        departmentType: department.type,
        description: department.description,
        status: RecordStatus.ACTIVE,
      },
    });
  }

  console.log(
    `✓ Seeded ${departments.length} departments`,
  );
}