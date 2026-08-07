import assert from "node:assert/strict";
import test from "node:test";
import { integrationConfig } from "./integration.config";
import {
  DOCUMENT_TYPES,
  nextDocumentNumber,
} from "../shared/sequences";

const config = integrationConfig();

test(
  "document sequence allocation remains unique under concurrency",
  {
    skip:
      !config.runSequenceConcurrency ||
      config.hospitalId === undefined,
  },
  async () => {
    assert.ok(config.hospitalId);

    const date = new Date();

    const allocations = await Promise.all(
      Array.from({ length: 25 }, () =>
        nextDocumentNumber({
          hospitalId: config.hospitalId!,
          ...(config.branchId !== undefined
            ? { branchId: config.branchId }
            : {}),
          documentType: DOCUMENT_TYPES.BILLING_INVOICE,
          prefix: "E2EINV",
          period: "DATE",
          date,
          padding: 8,
        }),
      ),
    );

    const numbers = allocations.map(
      (allocation) => allocation.number,
    );

    assert.equal(numbers.length, 25);
    assert.equal(new Set(numbers).size, 25);

    const sequences = allocations
      .map((allocation) => allocation.sequence)
      .sort((left, right) =>
        left < right ? -1 : left > right ? 1 : 0,
      );

    for (let index = 1; index < sequences.length; index += 1) {
      assert.equal(
        sequences[index]! - sequences[index - 1]!,
        1n,
      );
    }
  },
);
