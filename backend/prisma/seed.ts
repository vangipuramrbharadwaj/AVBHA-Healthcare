/// <reference types="node" />
import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  DataScope,
  PrismaClient,
  RecordStatus,
  UserStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Required environment variable ${name} is missing`);
  }

  return value;
}

const modules = [
  "dashboard",
  "hospitals",
  "branches",
  "departments",
  "designations",
  "employees",
  "doctors",
  "users",
  "roles",
  "permissions",
  "patients",
  "appointments",
  "opd",
  "consultation",
  "ipd",
  "nursing",
  "operation_theatre",
  "laboratory",
  "radiology",
  "pharmacy",
  "inventory",
  "billing",
  "discharge",
  "attendance",
  "leave",
  "shift",
  "payroll",
  "recruitment",
  "expenses",
  "reports",
  "settings",
  "audit",
] as const;

const actions = [
  "view",
  "create",
  "update",
  "delete",
  "approve",
  "export",
  "print",
] as const;

type ModuleCode = (typeof modules)[number];
type ActionCode = (typeof actions)[number];

interface RoleDefinition {
  code: string;
  name: string;
  description: string;
  scope: DataScope;
  permissions: Array<{
    module: ModuleCode;
    actions: ActionCode[];
  }>;
}

const allActions: ActionCode[] = [...actions];

function modulePermissions(
  selectedModules: ModuleCode[],
  selectedActions: ActionCode[] = allActions,
): RoleDefinition["permissions"] {
  return selectedModules.map((module) => ({
    module,
    actions: selectedActions,
  }));
}

const roleDefinitions: RoleDefinition[] = [
  {
    code: "SUPER_ADMIN",
    name: "Super Administrator",
    description: "Full access to the complete hospital installation",
    scope: DataScope.HOSPITAL,
    permissions: modulePermissions([...modules]),
  },
  {
    code: "ADMIN",
    name: "Hospital Administrator",
    description: "Hospital administration and operational management",
    scope: DataScope.HOSPITAL,
    permissions: modulePermissions([...modules]),
  },
  {
    code: "DOCTOR",
    name: "Doctor",
    description: "Clinical consultation and patient-care access",
    scope: DataScope.OWN,
    permissions: [
      ...modulePermissions(
        [
          "dashboard",
          "patients",
          "appointments",
          "opd",
          "consultation",
          "ipd",
          "nursing",
          "laboratory",
          "radiology",
          "pharmacy",
          "discharge",
          "reports",
        ],
        ["view", "create", "update", "print"],
      ),
    ],
  },
  {
    code: "RECEPTION",
    name: "Reception",
    description: "Patient registration, appointments and front-office access",
    scope: DataScope.BRANCH,
    permissions: modulePermissions(
      ["dashboard", "patients", "appointments", "opd", "billing"],
      ["view", "create", "update", "print"],
    ),
  },
  {
    code: "NURSE",
    name: "Nurse",
    description: "Nursing, vitals and inpatient-care access",
    scope: DataScope.DEPARTMENT,
    permissions: modulePermissions(
      ["dashboard", "patients", "opd", "ipd", "nursing", "discharge"],
      ["view", "create", "update", "print"],
    ),
  },
  {
    code: "PHARMACIST",
    name: "Pharmacist",
    description: "Pharmacy dispensing and medicine stock access",
    scope: DataScope.BRANCH,
    permissions: [
      ...modulePermissions(
        ["dashboard", "pharmacy", "inventory"],
        ["view", "create", "update", "approve", "print", "export"],
      ),
      ...modulePermissions(["patients"], ["view"]),
    ],
  },
  {
    code: "LAB_TECHNICIAN",
    name: "Laboratory Technician",
    description: "Laboratory orders, samples and results access",
    scope: DataScope.DEPARTMENT,
    permissions: [
      ...modulePermissions(
        ["dashboard", "laboratory"],
        ["view", "create", "update", "approve", "print"],
      ),
      ...modulePermissions(["patients"], ["view"]),
    ],
  },
  {
    code: "RADIOLOGY_TECHNICIAN",
    name: "Radiology Technician",
    description: "Radiology scheduling, imaging and reporting access",
    scope: DataScope.DEPARTMENT,
    permissions: [
      ...modulePermissions(
        ["dashboard", "radiology"],
        ["view", "create", "update", "print"],
      ),
      ...modulePermissions(["patients"], ["view"]),
    ],
  },
  {
    code: "BILLING",
    name: "Billing Executive",
    description: "Invoices, collections and billing reports access",
    scope: DataScope.BRANCH,
    permissions: [
      ...modulePermissions(
        ["dashboard", "billing", "expenses", "reports"],
        ["view", "create", "update", "approve", "print", "export"],
      ),
      ...modulePermissions(["patients"], ["view"]),
    ],
  },
  {
    code: "HR",
    name: "Human Resources",
    description: "Employee and workforce-management access",
    scope: DataScope.HOSPITAL,
    permissions: modulePermissions(
      [
        "dashboard",
        "departments",
        "designations",
        "employees",
        "doctors",
        "attendance",
        "leave",
        "shift",
        "payroll",
        "recruitment",
        "reports",
      ],
      ["view", "create", "update", "approve", "print", "export"],
    ),
  },
];

async function seedPermissions(): Promise<Map<string, string>> {
  const permissionIds = new Map<string, string>();

  for (const moduleCode of modules) {
    for (const actionCode of actions) {
      const permissionCode = `${moduleCode}.${actionCode}`;

      const permission = await prisma.permission.upsert({
        where: {
          permissionCode,
        },
        update: {
          moduleCode,
          actionCode,
          description: `${actionCode} access for ${moduleCode}`,
        },
        create: {
          permissionCode,
          moduleCode,
          actionCode,
          description: `${actionCode} access for ${moduleCode}`,
        },
      });

      permissionIds.set(permissionCode, permission.id);
    }
  }

  return permissionIds;
}

async function main(): Promise<void> {
  const hospitalCode = requiredEnv("BOOTSTRAP_HOSPITAL_CODE");
  const adminUsername = requiredEnv("BOOTSTRAP_ADMIN_USERNAME");
  const adminEmail = requiredEnv("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const adminPassword = requiredEnv("BOOTSTRAP_ADMIN_PASSWORD");

  if (adminPassword.length < 12) {
    throw new Error(
      "BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters",
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.$transaction(
    async (transaction) => {
      const hospital = await transaction.hospital.upsert({
        where: {
          hospitalCode,
        },
        update: {
          legalName: requiredEnv("BOOTSTRAP_HOSPITAL_LEGAL_NAME"),
          displayName: requiredEnv("BOOTSTRAP_HOSPITAL_DISPLAY_NAME"),
          email: requiredEnv("BOOTSTRAP_HOSPITAL_EMAIL").toLowerCase(),
          phone: requiredEnv("BOOTSTRAP_HOSPITAL_PHONE"),
          addressLine1: requiredEnv("BOOTSTRAP_HOSPITAL_ADDRESS"),
          city: requiredEnv("BOOTSTRAP_HOSPITAL_CITY"),
          state: requiredEnv("BOOTSTRAP_HOSPITAL_STATE"),
          postalCode: requiredEnv("BOOTSTRAP_HOSPITAL_POSTAL_CODE"),
          active: true,
          deletedAt: null,
        },
        create: {
          hospitalCode,
          legalName: requiredEnv("BOOTSTRAP_HOSPITAL_LEGAL_NAME"),
          displayName: requiredEnv("BOOTSTRAP_HOSPITAL_DISPLAY_NAME"),
          email: requiredEnv("BOOTSTRAP_HOSPITAL_EMAIL").toLowerCase(),
          phone: requiredEnv("BOOTSTRAP_HOSPITAL_PHONE"),
          addressLine1: requiredEnv("BOOTSTRAP_HOSPITAL_ADDRESS"),
          city: requiredEnv("BOOTSTRAP_HOSPITAL_CITY"),
          state: requiredEnv("BOOTSTRAP_HOSPITAL_STATE"),
          postalCode: requiredEnv("BOOTSTRAP_HOSPITAL_POSTAL_CODE"),
          country: "India",
          timezone: "Asia/Kolkata",
          currencyCode: "INR",
          active: true,
        },
      });

      const branch = await transaction.hospitalBranch.upsert({
        where: {
          hospitalId_branchCode: {
            hospitalId: hospital.id,
            branchCode: requiredEnv("BOOTSTRAP_BRANCH_CODE"),
          },
        },
        update: {
          branchName: requiredEnv("BOOTSTRAP_BRANCH_NAME"),
          phone: requiredEnv("BOOTSTRAP_HOSPITAL_PHONE"),
          address: requiredEnv("BOOTSTRAP_HOSPITAL_ADDRESS"),
          city: requiredEnv("BOOTSTRAP_HOSPITAL_CITY"),
          state: requiredEnv("BOOTSTRAP_HOSPITAL_STATE"),
          postalCode: requiredEnv("BOOTSTRAP_HOSPITAL_POSTAL_CODE"),
          isMainBranch: true,
          status: RecordStatus.ACTIVE,
          deletedAt: null,
        },
        create: {
          hospitalId: hospital.id,
          branchCode: requiredEnv("BOOTSTRAP_BRANCH_CODE"),
          branchName: requiredEnv("BOOTSTRAP_BRANCH_NAME"),
          branchType: "HOSPITAL",
          email: requiredEnv("BOOTSTRAP_HOSPITAL_EMAIL").toLowerCase(),
          phone: requiredEnv("BOOTSTRAP_HOSPITAL_PHONE"),
          address: requiredEnv("BOOTSTRAP_HOSPITAL_ADDRESS"),
          city: requiredEnv("BOOTSTRAP_HOSPITAL_CITY"),
          state: requiredEnv("BOOTSTRAP_HOSPITAL_STATE"),
          postalCode: requiredEnv("BOOTSTRAP_HOSPITAL_POSTAL_CODE"),
          isMainBranch: true,
          status: RecordStatus.ACTIVE,
        },
      });

      const permissionIds = new Map<string, string>();

      for (const moduleCode of modules) {
        for (const actionCode of actions) {
          const permissionCode = `${moduleCode}.${actionCode}`;

          const permission = await transaction.permission.upsert({
            where: {
              permissionCode,
            },
            update: {
              moduleCode,
              actionCode,
              description: `${actionCode} access for ${moduleCode}`,
            },
            create: {
              permissionCode,
              moduleCode,
              actionCode,
              description: `${actionCode} access for ${moduleCode}`,
            },
          });

          permissionIds.set(permissionCode, permission.id);
        }
      }

      const roleIds = new Map<string, string>();

      for (const roleDefinition of roleDefinitions) {
        const role = await transaction.role.upsert({
          where: {
            hospitalId_roleCode: {
              hospitalId: hospital.id,
              roleCode: roleDefinition.code,
            },
          },
          update: {
            roleName: roleDefinition.name,
            description: roleDefinition.description,
            dataScope: roleDefinition.scope,
            isSystemRole: true,
            status: RecordStatus.ACTIVE,
            deletedAt: null,
          },
          create: {
            hospitalId: hospital.id,
            roleCode: roleDefinition.code,
            roleName: roleDefinition.name,
            description: roleDefinition.description,
            dataScope: roleDefinition.scope,
            isSystemRole: true,
            status: RecordStatus.ACTIVE,
          },
        });

        roleIds.set(roleDefinition.code, role.id);

        await transaction.rolePermission.deleteMany({
          where: {
            roleId: role.id,
          },
        });

        const rolePermissionRows = roleDefinition.permissions.flatMap(
          ({ module, actions: allowedActions }) =>
            allowedActions.map((action) => {
              const permissionCode = `${module}.${action}`;
              const permissionId = permissionIds.get(permissionCode);

              if (!permissionId) {
                throw new Error(
                  `Permission ${permissionCode} was not created`,
                );
              }

              return {
                roleId: role.id,
                permissionId,
              };
            }),
        );

        if (rolePermissionRows.length > 0) {
          await transaction.rolePermission.createMany({
            data: rolePermissionRows,
            skipDuplicates: true,
          });
        }
      }

      const adminUser = await transaction.user.upsert({
        where: {
          hospitalId_username: {
            hospitalId: hospital.id,
            username: adminUsername,
          },
        },
        update: {
          branchId: branch.id,
          fullName: requiredEnv("BOOTSTRAP_ADMIN_NAME"),
          email: adminEmail,
          passwordHash,
          mustChangePassword: true,
          failedLoginCount: 0,
          lockedUntil: null,
          status: UserStatus.ACTIVE,
          deletedAt: null,
        },
        create: {
          hospitalId: hospital.id,
          branchId: branch.id,
          fullName: requiredEnv("BOOTSTRAP_ADMIN_NAME"),
          username: adminUsername,
          email: adminEmail,
          passwordHash,
          mustChangePassword: true,
          status: UserStatus.ACTIVE,
        },
      });

      const adminRoleId = roleIds.get("SUPER_ADMIN");

      if (!adminRoleId) {
        throw new Error("SUPER_ADMIN role was not created");
      }

      await transaction.userRole.upsert({
        where: {
          userId_roleId: {
            userId: adminUser.id,
            roleId: adminRoleId,
          },
        },
        update: {
          effectiveTo: null,
        },
        create: {
          userId: adminUser.id,
          roleId: adminRoleId,
        },
      });

      console.log("AVBHA Healthcare bootstrap completed successfully");
      console.log(`Hospital: ${hospital.displayName}`);
      console.log(`Branch: ${branch.branchName}`);
      console.log(`Administrator username: ${adminUsername}`);
      console.log("Administrator password was not printed for security.");
      console.log("The administrator must change the password at first login.");
    },
    {
      timeout: 60_000,
    },
  );
}

main()
  .catch((error: unknown) => {
    console.error("AVBHA Healthcare bootstrap failed");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });