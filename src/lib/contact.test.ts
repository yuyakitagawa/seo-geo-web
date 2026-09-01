import assert from "node:assert/strict";
import test from "node:test";
import { validateContact } from "./contact";

test("validateContact accepts a valid optional-email submission", () => {
  const result = validateContact({ topic: "correction", name: "山田", message: "記事の内容を確認してください。" });

  assert.equal(result.ok, true);
});

test("validateContact rejects unknown topics and short messages", () => {
  assert.equal(validateContact({ topic: "unknown", message: "十分長い本文です" }).ok, false);
  assert.equal(validateContact({ topic: "other", message: "短い" }).ok, false);
});
