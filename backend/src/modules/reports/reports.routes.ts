import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import * as controller from "./reports.controller";
import { REPORT_PERMISSIONS } from "./reports.permissions";

export const reportsRouter = Router();

reportsRouter.use(authenticate, enforceTenant);
reportsRouter.use(requirePermission(REPORT_PERMISSIONS.VIEW));

reportsRouter.get("/overview", controller.overviewController);
reportsRouter.get("/daily-mis", controller.dailyMisController);
reportsRouter.get("/patients/registrations", controller.patientRegistrationController);
reportsRouter.get("/appointments", controller.appointmentsController);
reportsRouter.get("/opd", controller.opdController);
reportsRouter.get("/ipd", controller.ipdController);
reportsRouter.get("/revenue", controller.revenueController);
reportsRouter.get("/laboratory", controller.laboratoryController);
reportsRouter.get("/radiology", controller.radiologyController);
reportsRouter.get("/pharmacy", controller.pharmacyController);
reportsRouter.get("/inventory", controller.inventoryController);
reportsRouter.get("/departments/performance", controller.departmentsController);
reportsRouter.get("/doctors/performance", controller.doctorsController);
