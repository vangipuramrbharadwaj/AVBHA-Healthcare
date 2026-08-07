import { communicationsRouter } from "./modules/communications";
import { inventoryRouter } from "./modules/inventory";
import { systemHealthRouter } from "./modules/system-health";
import { requestTraceMiddleware } from "./middleware/request-trace.middleware";
import { standardNotFoundMiddleware } from "./middleware/not-found.middleware";
import { standardErrorMiddleware } from "./middleware/standard-error.middleware";
import { operationTheatreRouter } from "./modules/operation-theatre";
import { billingRouter } from "./modules/billing";
import { pharmacyRouter } from "./modules/pharmacy";
import { radiologyRouter } from "./modules/radiology";
import { laboratoryRouter } from "./modules/laboratory";
import { ipdRouter } from "./modules/ipd";
import { opdRouter } from "./modules/opd";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { authenticationRouter } from "./modules/authentication/authentication.routes";
import { branchesRouter } from "./modules/branches";
import { dashboardRouter } from "./modules/dashboard";
import { departmentsRouter } from "./modules/departments";
import { designationsRouter } from "./modules/designations";
import { employeesRouter } from "./modules/employees";
import { hospitalsRouter } from "./modules/hospitals";
import { appointmentsRouter } from "./modules/appointments";
import {
  patientAdvancedRouter,
  patientClinicalRouter,
  patientMergeRouter,
  patientsRouter,
} from "./modules/patients";
export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

// PHASE 11.3 CURRENT APP INTEGRATION
app.use(requestTraceMiddleware);

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



// PHASE 11.4 SYSTEM HEALTH ROUTER
app.use("/api/v1", systemHealthRouter);

app.use("/api/v1/auth", authenticationRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/hospitals", hospitalsRouter);
app.use("/api/v1/branches", branchesRouter);
app.use("/api/v1/departments", departmentsRouter);
app.use("/api/v1/designations", designationsRouter);
app.use("/api/v1/employees", employeesRouter);
app.use("/api/v1/patients", patientsRouter);
app.use("/api/v1/appointments", appointmentsRouter);
app.use("/api/v1/opd", opdRouter);
app.use("/api/v1/ipd", ipdRouter);
app.use("/api/v1/laboratory", laboratoryRouter);
app.use("/api/v1/radiology", radiologyRouter);
app.use("/api/v1/pharmacy", pharmacyRouter);
app.use("/api/v1/inventory", inventoryRouter);
app.use("/api/v1/communications", communicationsRouter);
app.use("/api/v1/billing", billingRouter);
app.use("/api/v1/operation-theatre", operationTheatreRouter);
app.use("/api/v1/patients", patientClinicalRouter);
app.use("/api/v1/patients", patientAdvancedRouter);
app.use("/api/v1/patients", patientMergeRouter);

// PHASE 11.3 standardized terminal middleware
app.use(standardNotFoundMiddleware);
app.use(standardErrorMiddleware);
