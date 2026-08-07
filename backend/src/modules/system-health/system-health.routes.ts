import { Router } from "express";
import {
  databaseController,
  healthController,
  liveController,
  monitoringController,
  readyController,
  versionController,
} from "./system-health.controller";

export const systemHealthRouter = Router();

systemHealthRouter.get("/health", healthController);
systemHealthRouter.get("/live", liveController);
systemHealthRouter.get("/ready", readyController);
systemHealthRouter.get("/database", databaseController);
systemHealthRouter.get("/version", versionController);
systemHealthRouter.get("/monitoring", monitoringController);
