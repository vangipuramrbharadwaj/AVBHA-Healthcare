import assert from "node:assert/strict";
import test from "node:test";
import { DASHBOARD_PERMISSIONS } from "./dashboard.permissions";

test("dashboard view permission remains stable", () => {
  assert.equal(DASHBOARD_PERMISSIONS.VIEW, "dashboard.view");
});
