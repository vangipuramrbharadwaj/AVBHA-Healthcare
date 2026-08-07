import { prisma } from "../../database/prisma";
import { env } from "../../config/env";

const startedAt = new Date();

interface DatabaseHealth {
  status: "connected" | "disconnected";
  latencyMs: number;
}

async function databaseHealth(
  timeoutMs = 3000,
): Promise<DatabaseHealth> {
  const started = process.hrtime.bigint();

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Database health check timed out")),
          timeoutMs,
        );

        timeout.unref();
      }),
    ]);

    const elapsed =
      Number(process.hrtime.bigint() - started) / 1_000_000;

    return {
      status: "connected",
      latencyMs: Number(elapsed.toFixed(2)),
    };
  } catch {
    const elapsed =
      Number(process.hrtime.bigint() - started) / 1_000_000;

    return {
      status: "disconnected",
      latencyMs: Number(elapsed.toFixed(2)),
    };
  }
}

export function liveness() {
  return {
    status: "alive" as const,
    application: "AVBHA Healthcare HMS",
    uptimeSeconds: Math.floor(process.uptime()),
  };
}

export async function readiness() {
  const database = await databaseHealth();

  return {
    status:
      database.status === "connected"
        ? ("ready" as const)
        : ("not_ready" as const),
    database,
  };
}

export async function health() {
  const database = await databaseHealth();

  return {
    status:
      database.status === "connected"
        ? ("healthy" as const)
        : ("degraded" as const),
    application: "AVBHA Healthcare HMS",
    environment: env.NODE_ENV,
    database,
    uptimeSeconds: Math.floor(process.uptime()),
    startedAt: startedAt.toISOString(),
    version:
      process.env.APP_VERSION ??
      process.env.npm_package_version ??
      "1.0.0",
  };
}

export async function databaseStatus() {
  return databaseHealth();
}

export function versionInfo() {
  return {
    application: "AVBHA Healthcare HMS",
    version:
      process.env.APP_VERSION ??
      process.env.npm_package_version ??
      "1.0.0",
    nodeVersion: process.version,
    environment: env.NODE_ENV,
  };
}

export async function monitoring() {
  const database = await databaseHealth();
  const memory = process.memoryUsage();

  return {
    application: "AVBHA Healthcare HMS",
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    startedAt: startedAt.toISOString(),
    database,
    memory: {
      rssMb: Number(
        (memory.rss / 1024 / 1024).toFixed(2),
      ),
      heapTotalMb: Number(
        (memory.heapTotal / 1024 / 1024).toFixed(2),
      ),
      heapUsedMb: Number(
        (memory.heapUsed / 1024 / 1024).toFixed(2),
      ),
      externalMb: Number(
        (memory.external / 1024 / 1024).toFixed(2),
      ),
    },
    process: {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
    },
  };
}
