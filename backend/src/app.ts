import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./database/prisma";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middleware/error.middleware";
import { requestIdMiddleware } from "./middleware/request-id.middleware";
import { authenticationRouter } from "./modules/authentication/authentication.routes";
import { dashboardRouter } from "./modules/dashboard";
import { successResponse } from "./shared/http/api-response";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(requestIdMiddleware);

app.use(
  pinoHttp({
    logger,
    customProps: (req) => ({
      requestId: req.id,
    }),
  }),
);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-ID",
      "X-Branch-ID",
      "X-Hospital-ID",
    ],
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/api/v1/health", async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json(
      successResponse(
        {
          application: "AVBHA Healthcare HMS",
          environment: env.NODE_ENV,
          database: "connected",
          uptimeSeconds: Math.floor(process.uptime()),
          version: "1.0.0",
        },
        "AVBHA Healthcare API is healthy",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
});

app.use("/api/v1/auth", authenticationRouter);
app.use("/api/v1/dashboard", dashboardRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
