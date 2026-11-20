import assert from "node:assert/strict";
import test from "node:test";

import { employeeIdSchema } from "./employee-id.ts";

test("employee IDs preserve all six digits, including leading zeroes", () => {
  assert.equal(employeeIdSchema.parse("001234"), "001234");
});

test("employee IDs reject missing values, non-ASCII digits and unexpected lengths", () => {
  for (const value of ["", "12345", "1234567", "12345a", "１２３４５６", "123456\n", 123456]) {
    assert.equal(employeeIdSchema.safeParse(value).success, false);
  }
});
