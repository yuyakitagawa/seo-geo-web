import assert from "node:assert/strict";
import test from "node:test";
import { MAX_BYTES, readCapped } from "./fetchPage";

test("readCapped returns the full small response", async () => {
  const result = await readCapped(new Response("audit HTML"));

  assert.deepEqual(result, { text: "audit HTML", bytes: 10, truncated: false });
});

test("readCapped caps oversized responses and marks them as truncated", async () => {
  const body = new Uint8Array(MAX_BYTES + 1).fill(65);
  const result = await readCapped(new Response(body));

  assert.equal(result.bytes, MAX_BYTES);
  assert.equal(result.text.length, MAX_BYTES);
  assert.equal(result.truncated, true);
});
