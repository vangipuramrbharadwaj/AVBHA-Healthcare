import type { Server } from "node:http";
import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./database/prisma";

let server: Server | undefined;
let shuttingDown = false;

async function startServer(): Promise<void> {
  try {
    await prisma.$connect();

    logger.info("Database connection established");

    server = app.listen(env.PORT, "0.0.0.0", () => {
      logger.info(
        {
          port: env.PORT,
          environment: env.NODE_ENV,
        },
        `AVBHA Healthcare API started at http://localhost:${env.PORT}`,
      );
    });
  } catch (error) {
    logger.fatal({ error }, "Unable to start AVBHA Healthcare API");

    await prisma.$disconnect().catch(() => undefined);

    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  logger.info({ signal }, "Graceful shutdown started");

  const forceShutdownTimer = setTimeout(() => {
    logger.fatal("Graceful shutdown timed out");

    process.exit(1);
  }, 10_000);

  forceShutdownTimer.unref();

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await prisma.$disconnect();

    logger.info("Graceful shutdown completed");

    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Graceful shutdown failed");

    process.exit(1);
  }
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled promise rejection");

  void shutdown("unhandledRejection");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught exception");

  void shutdown("uncaughtException");
});

void startServer();