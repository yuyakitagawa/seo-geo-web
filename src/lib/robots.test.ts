import assert from "node:assert/strict";
import test from "node:test";
import { check, parseRobots } from "./robots";

test("specific user-agent rules take precedence over wildcard rules", () => {
  const robots = parseRobots("User-agent: *\nDisallow: /\n\nUser-agent: OAI-SearchBot\nAllow: /public\nDisallow: /private");

  assert.equal(check(robots, "OAI-SearchBot", "/public/page").allowed, true);
  assert.equal(check(robots, "OAI-SearchBot", "/private/page").allowed, false);
  assert.equal(check(robots, "OtherBot", "/public/page").allowed, false);
});
