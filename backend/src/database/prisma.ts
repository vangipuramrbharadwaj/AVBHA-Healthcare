import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

declare global {
  // Prevent multiple Prisma clients during local hot reload.
  // eslint-disable-next-line no-var
  var prismaClient: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

export const prisma =
  global.prismaClient ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  global.prismaClient = prisma;
}