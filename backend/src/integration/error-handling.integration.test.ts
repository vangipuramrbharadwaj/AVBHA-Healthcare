import assert from "node:assert/strict";
import test from "node:test";
import { apiCall } from "./integration.client";
import {
  assertError,
} from "./integration.assertions";

test("unknown API route uses standardized 404 response", async () => {
  const result = await apiCall(
    "/api/v1/__phase_11_5_route_that_does_not_exist__",
  );

  const body = assertError(result, [404]);
  assert.equal(body.code, "ROUTE_NOT_FOUND");
});

const protectedRoutes = [
  "/api/v1/patients",
  "/api/v1/appointments",
  "/api/v1/opd",
  "/api/v1/ipd",
  "/api/v1/laboratory",
  "/api/v1/radiology",
  "/api/v1/pharmacy",
  "/api/v1/billing/invoices",
  "/api/v1/operation-theatre/bookings",
];

for (const route of protectedRoutes) {
  test(`protected route rejects unauthenticated access: ${route}`, async () => {
    const result = await apiCall(route);

    assertError(result, [401, 403]);
  });
}
