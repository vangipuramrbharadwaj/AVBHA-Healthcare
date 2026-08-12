import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { enforceTenant } from "../../middleware/tenant.middleware";
import {
  syncChargesController,
  listRefundsController,
  listChargesController,
  listAdvancesController,
  createInvoiceFromChargesController,
  applyAdvanceController,
  cancelInvoiceController,
  createAdvanceController,
  createInvoiceController,
  createServiceController,
  dashboardController,
  getInvoiceController,
  listInvoicesController,
  listServicesController,
  patientLedgerController,
  recordPaymentController,
  requestRefundController,
  updateRefundStatusController,
} from "./billing.controller";
import { BILLING_PERMISSIONS } from "./billing.permissions";

export const billingRouter = Router();
billingRouter.use(authenticate, enforceTenant);

billingRouter.get(
  "/dashboard",
  requirePermission(BILLING_PERMISSIONS.VIEW),
  dashboardController,
);

billingRouter.post(
  "/services",
  requirePermission(BILLING_PERMISSIONS.CREATE),
  createServiceController,
);

billingRouter.get(
  "/services",
  requirePermission(BILLING_PERMISSIONS.VIEW),
  listServicesController,
);

billingRouter.post(
  "/invoices",
  requirePermission(BILLING_PERMISSIONS.CREATE),
  createInvoiceController,
);

billingRouter.get(
  "/invoices",
  requirePermission(BILLING_PERMISSIONS.VIEW),
  listInvoicesController,
);

billingRouter.get(
  "/invoices/:id",
  requirePermission(BILLING_PERMISSIONS.VIEW),
  getInvoiceController,
);

billingRouter.post(
  "/invoices/:id/payments",
  requirePermission(BILLING_PERMISSIONS.CREATE),
  recordPaymentController,
);

billingRouter.post(
  "/invoices/:id/refunds",
  requirePermission(BILLING_PERMISSIONS.REFUND),
  requestRefundController,
);

billingRouter.post(
  "/invoices/:id/cancel",
  requirePermission(BILLING_PERMISSIONS.DELETE),
  cancelInvoiceController,
);

billingRouter.post(
  "/advances",
  requirePermission(BILLING_PERMISSIONS.CREATE),
  createAdvanceController,
);

billingRouter.post(
  "/refunds/:id/status",
  requirePermission(BILLING_PERMISSIONS.APPROVE),
  updateRefundStatusController,
);

billingRouter.get(
  "/patient-ledger",
  requirePermission(BILLING_PERMISSIONS.VIEW),
  patientLedgerController,
);


billingRouter.post(
  "/charges/sync",
  requirePermission(BILLING_PERMISSIONS.CREATE),
  syncChargesController,
);

billingRouter.get(
  "/charges",
  requirePermission(BILLING_PERMISSIONS.VIEW),
  listChargesController,
);

billingRouter.post(
  "/invoices/from-charges",
  requirePermission(BILLING_PERMISSIONS.CREATE),
  createInvoiceFromChargesController,
);

billingRouter.get(
  "/advances",
  requirePermission(BILLING_PERMISSIONS.VIEW),
  listAdvancesController,
);

billingRouter.post(
  "/invoices/:id/apply-advance",
  requirePermission(BILLING_PERMISSIONS.CREATE),
  applyAdvanceController,
);

billingRouter.get(
  "/refunds",
  requirePermission(BILLING_PERMISSIONS.VIEW),
  listRefundsController,
);
