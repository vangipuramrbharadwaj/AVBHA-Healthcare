import assert from "node:assert/strict";
import test from "node:test";
import { EMPLOYEE_PERMISSIONS } from "./employees.permissions";

test("employee permissions remain stable", () => {
  assert.equal(
    EMPLOYEE_PERMISSIONS.VIEW,
    "employees.view",
  );
  assert.equal(
    EMPLOYEE_PERMISSIONS.CREATE,
    "employees.create",
  );
});
