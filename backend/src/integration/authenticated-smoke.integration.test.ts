import test from "node:test";
import { integrationConfig } from "./integration.config";
import { apiCall } from "./integration.client";
import {
  assertStandardEnvelope,
} from "./integration.assertions";
import assert from "node:assert/strict";

const config = integrationConfig();

const routes = [
  "/api/v1/dashboard",
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

test(
  "authenticated module smoke test",
  {
    skip:
      !config.runAuthenticatedSmoke ||
      config.accessToken === undefined,
  },
  async () => {
    assert.ok(config.accessToken);

    for (const route of routes) {
      const result = await apiCall(route, {
        token: config.accessToken,
      });

      assert.ok(
        result.status >= 200 && result.status < 500,
        `${route} returned unexpected server error ${result.status}: ${result.rawText}`,
      );

      assertStandardEnvelope(result);

      assert.notEqual(
        result.status,
        500,
        `${route} must not return HTTP 500`,
      );
    }
  },
);
