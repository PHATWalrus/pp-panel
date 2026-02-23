import test from "node:test";
import assert from "node:assert/strict";
import { reorderByIndices, remapIndexOnMove } from "../flow-utils";

test("reorderByIndices moves item forward", () => {
  const pages = [{ name: "Login" }, { name: "OTP" }, { name: "Success" }];
  const reordered = reorderByIndices(pages, 0, 2);
  assert.deepEqual(reordered.map((p) => p.name), ["OTP", "Success", "Login"]);
});

test("reorderByIndices moves item backward", () => {
  const pages = [{ name: "Login" }, { name: "OTP" }, { name: "Success" }];
  const reordered = reorderByIndices(pages, 2, 0);
  assert.deepEqual(reordered.map((p) => p.name), ["Success", "Login", "OTP"]);
});

test("reorderByIndices is stable on invalid indexes", () => {
  const pages = [{ name: "Login" }, { name: "OTP" }];
  const reordered = reorderByIndices(pages, 5, 1);
  assert.deepEqual(reordered, pages);
});

test("remapIndexOnMove moves current index with dragged item", () => {
  assert.equal(remapIndexOnMove(2, 2, 0), 0);
});

test("remapIndexOnMove shifts down when item moved above current", () => {
  assert.equal(remapIndexOnMove(2, 0, 2), 1);
});

test("remapIndexOnMove shifts up when item moved below current", () => {
  assert.equal(remapIndexOnMove(1, 3, 0), 2);
});
