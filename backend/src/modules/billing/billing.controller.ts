import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { successResponse } from "../../shared/http/api-response";
import * as schema from "./billing.schema";
import * as service from "./billing.service";

export async function createServiceController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = schema.serviceCatalogSchema.parse(req.body);

    const result = await service.createService(
      req.auth!.hospitalId,
      req.auth!.userId,
      {
        serviceCode: input.serviceCode,
        serviceName: input.serviceName,
        moduleCode: input.moduleCode,
        basePrice: input.basePrice,
        discountAllowed: input.discountAllowed,
        ...(input.departmentId !== undefined
          ? { departmentId: input.departmentId }
          : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.gstPercent !== undefined
          ? { gstPercent: input.gstPercent }
          : {}),
      },
    );

    res.status(201).json(
      successResponse(
        result,
        "Billing service created successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function listServicesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await service.listServices(
      req.auth!.hospitalId,
    );

    res.json(
      successResponse(
        result,
        "Billing services retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function createInvoiceController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = schema.invoiceSchema.parse(req.body);

    const items = input.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      ...(item.serviceId !== undefined
        ? { serviceId: item.serviceId }
        : {}),
      ...(item.sourceModule !== undefined
        ? { sourceModule: item.sourceModule }
        : {}),
      ...(item.sourceEntityId !== undefined
        ? { sourceEntityId: item.sourceEntityId }
        : {}),
      ...(item.discountPercent !== undefined
        ? { discountPercent: item.discountPercent }
        : {}),
      ...(item.taxPercent !== undefined
        ? { taxPercent: item.taxPercent }
        : {}),
    }));

    const result = await service.createInvoice(
      req.auth!.hospitalId,
      req.auth!.userId,
      {
        branchId: input.branchId,
        patientId: input.patientId,
        discountAmount: input.discountAmount,
        roundOffAmount: input.roundOffAmount,
        items,
        ...(input.opdVisitId !== undefined
          ? { opdVisitId: input.opdVisitId }
          : {}),
        ...(input.ipdAdmissionId !== undefined
          ? { ipdAdmissionId: input.ipdAdmissionId }
          : {}),
        ...(input.dueDate !== undefined
          ? { dueDate: input.dueDate }
          : {}),
        ...(input.notes !== undefined
          ? { notes: input.notes }
          : {}),
      },
    );

    res.status(201).json(
      successResponse(
        result,
        "Invoice created successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function listInvoicesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = schema.listInvoicesSchema.parse(req.query);

    const result = await service.listInvoices(
      req.auth!.hospitalId,
      {
        page: query.page,
        pageSize: query.pageSize,
        ...(query.patientId !== undefined
          ? { patientId: query.patientId }
          : {}),
        ...(query.status !== undefined
          ? { status: query.status }
          : {}),
      },
    );

    res.json(
      successResponse(
        result,
        "Invoices retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function getInvoiceController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);

    const result = await service.getInvoice(
      req.auth!.hospitalId,
      id,
    );

    res.json(
      successResponse(
        result,
        "Invoice retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function recordPaymentController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.paymentSchema.parse(req.body);

    const result = await service.recordPayment(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      {
        paymentMode: input.paymentMode,
        amount: input.amount,
        ...(input.transactionReference !== undefined
          ? {
              transactionReference:
                input.transactionReference,
            }
          : {}),
        ...(input.remarks !== undefined
          ? { remarks: input.remarks }
          : {}),
      },
    );

    res.status(201).json(
      successResponse(
        result,
        "Payment recorded successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function createAdvanceController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = schema.advanceSchema.parse(req.body);

    const result = await service.createAdvance(
      req.auth!.hospitalId,
      req.auth!.userId,
      {
        branchId: input.branchId,
        patientId: input.patientId,
        paymentMode: input.paymentMode,
        amount: input.amount,
        ...(input.transactionReference !== undefined
          ? {
              transactionReference:
                input.transactionReference,
            }
          : {}),
        ...(input.remarks !== undefined
          ? { remarks: input.remarks }
          : {}),
      },
    );

    res.status(201).json(
      successResponse(
        result,
        "Advance payment recorded successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function requestRefundController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.refundSchema.parse(req.body);

    const result = await service.requestRefund(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      {
        amount: input.amount,
        reason: input.reason,
        ...(input.paymentId !== undefined
          ? { paymentId: input.paymentId }
          : {}),
        ...(input.paymentMode !== undefined
          ? { paymentMode: input.paymentMode }
          : {}),
      },
    );

    res.status(201).json(
      successResponse(
        result,
        "Refund request created successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateRefundStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.refundStatusSchema.parse(req.body);

    const result = await service.updateRefundStatus(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      input.status,
    );

    res.json(
      successResponse(
        result,
        "Refund status updated successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function cancelInvoiceController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.cancelInvoiceSchema.parse(req.body);

    const result = await service.cancelInvoice(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      input.reason,
    );

    res.json(
      successResponse(
        result,
        "Invoice cancelled successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function patientLedgerController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = schema.patientLedgerQuerySchema.parse(
      req.query,
    );

    const result = await service.patientLedger(
      req.auth!.hospitalId,
      query.patientId,
      query.page,
      query.pageSize,
    );

    res.json(
      successResponse(
        result,
        "Patient ledger retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function dashboardController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = schema.dashboardQuerySchema.parse(req.query);

    const result = await service.dashboard(
      req.auth!.hospitalId,
      query.date ?? new Date(),
    );

    res.json(
      successResponse(
        result,
        "Billing dashboard retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}


export async function syncChargesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await service.syncCharges(
      req.auth!.hospitalId,
      req.auth!.userId,
    );
    res.json(
      successResponse(
        result,
        "Billing charges synchronized successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function listChargesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = schema.billingChargeListSchema.parse(req.query);
    const result = await service.listCharges(
      req.auth!.hospitalId,
      {
        status: query.status,
        ...(query.patientId ? { patientId: query.patientId } : {}),
        ...(query.ipdAdmissionId
          ? { ipdAdmissionId: query.ipdAdmissionId }
          : {}),
        ...(query.opdVisitId
          ? { opdVisitId: query.opdVisitId }
          : {}),
      },
    );

    res.json(
      successResponse(
        result,
        "Billing charges retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function createInvoiceFromChargesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = schema.invoiceFromChargesSchema.parse(req.body);
    const result = await service.createInvoiceFromCharges(
      req.auth!.hospitalId,
      req.auth!.userId,
      {
        chargeIds: input.chargeIds,
        discountAmount: input.discountAmount,
        roundOffAmount: input.roundOffAmount,
        ...(input.notes !== undefined
          ? { notes: input.notes }
          : {}),
      },
    );

    res.status(201).json(
      successResponse(
        result,
        "Invoice generated from pending charges",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function listAdvancesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = schema.advanceListSchema.parse(req.query);
    const result = await service.listAdvances(
      req.auth!.hospitalId,
      query.patientId,
      query.availableOnly,
    );
    res.json(
      successResponse(
        result,
        "Advance payments retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function applyAdvanceController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = schema.idParamsSchema.parse(req.params);
    const input = schema.applyAdvanceSchema.parse(req.body);

    const result = await service.applyAdvanceToInvoice(
      req.auth!.hospitalId,
      id,
      req.auth!.userId,
      input.amount,
    );

    res.json(
      successResponse(
        result,
        "Advance applied to invoice successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function listRefundsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = schema.refundListSchema.parse(req.query);
    const result = await service.listRefunds(
      req.auth!.hospitalId,
      query.status,
    );
    res.json(
      successResponse(
        result,
        "Refunds retrieved successfully",
        req.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
}
