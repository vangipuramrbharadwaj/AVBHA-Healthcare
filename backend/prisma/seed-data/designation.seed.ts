import { Prisma, RecordStatus } from "@prisma/client";

interface DesignationSeed {
  code: string;
  name: string;
  departmentCode?: string;
  description: string;
}

const designations: DesignationSeed[] = [
  {
    code: "MS",
    name: "Medical Superintendent",
    description: "Head of hospital operations",
  },
  {
    code: "CMO",
    name: "Chief Medical Officer",
    description: "Chief Medical Officer",
  },
  {
    code: "SCON",
    name: "Senior Consultant",
    departmentCode: "GEN",
    description: "Senior Consultant Doctor",
  },
  {
    code: "CON",
    name: "Consultant",
    departmentCode: "GEN",
    description: "Consultant Doctor",
  },
  {
    code: "JCON",
    name: "Junior Consultant",
    departmentCode: "GEN",
    description: "Junior Consultant Doctor",
  },
  {
    code: "RDOC",
    name: "Resident Doctor",
    departmentCode: "GEN",
    description: "Resident Doctor",
  },
  {
    code: "MO",
    name: "Medical Officer",
    departmentCode: "GEN",
    description: "Medical Officer",
  },
  {
    code: "HN",
    name: "Head Nurse",
    description: "Head Nurse",
  },
  {
    code: "SN",
    name: "Staff Nurse",
    description: "Staff Nurse",
  },
  {
    code: "RECP",
    name: "Reception Executive",
    departmentCode: "ADM",
    description: "Reception Executive",
  },
  {
    code: "BILL",
    name: "Billing Executive",
    departmentCode: "BIL",
    description: "Billing Executive",
  },
  {
    code: "PHARM",
    name: "Pharmacist",
    departmentCode: "PHA",
    description: "Pharmacist",
  },
  {
    code: "CPHARM",
    name: "Chief Pharmacist",
    departmentCode: "PHA",
    description: "Chief Pharmacist",
  },
  {
    code: "LABTECH",
    name: "Laboratory Technician",
    departmentCode: "LAB",
    description: "Laboratory Technician",
  },
  {
    code: "SLABTECH",
    name: "Senior Laboratory Technician",
    departmentCode: "LAB",
    description: "Senior Laboratory Technician",
  },
  {
    code: "RADTECH",
    name: "Radiology Technician",
    departmentCode: "RAD",
    description: "Radiology Technician",
  },
  {
    code: "HR",
    name: "HR Executive",
    departmentCode: "ADM",
    description: "Human Resources Executive",
  },
  {
    code: "ACC",
    name: "Accountant",
    departmentCode: "ADM",
    description: "Accountant",
  },
  {
    code: "STORE",
    name: "Store Manager",
    departmentCode: "ADM",
    description: "Store Manager",
  },
  {
    code: "BIO",
    name: "Biomedical Engineer",
    departmentCode: "ADM",
    description: "Biomedical Engineer",
  },
];

export async function seedDesignations(
  tx: Prisma.TransactionClient,
  hospitalId: string,
): Promise<void> {
  for (const designation of designations) {
    let departmentId: string | null = null;

    if (designation.departmentCode) {
      const department = await tx.department.findUnique({
        where: {
          hospitalId_departmentCode: {
            hospitalId,
            departmentCode: designation.departmentCode,
          },
        },
        select: {
          id: true,
        },
      });

      departmentId = department?.id ?? null;
    }

    await tx.designation.upsert({
      where: {
        hospitalId_designationCode: {
          hospitalId,
          designationCode: designation.code,
        },
      },

      update: {
        designationName: designation.name,
        description: designation.description,
        departmentId,
        status: RecordStatus.ACTIVE,
        deletedAt: null,
      },

      create: {
        hospitalId,
        departmentId,
        designationCode: designation.code,
        designationName: designation.name,
        description: designation.description,
        status: RecordStatus.ACTIVE,
      },
    });
  }

  console.log(`✓ Seeded ${designations.length} designations`);
}