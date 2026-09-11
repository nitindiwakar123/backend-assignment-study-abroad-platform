const test = require("node:test");
const assert = require("node:assert/strict");
const { validStatusTransitions } = require("../src/config/constants");

test("application workflow permits only configured forward transitions", () => {
  assert.equal(validStatusTransitions.draft.includes("submitted"), true);
  assert.equal(validStatusTransitions.submitted.includes("offer-received"), false);
  assert.equal(validStatusTransitions.enrolled.length, 0);
});

test("status transition edge case: terminal rejection cannot be reopened", () => {
  assert.equal(validStatusTransitions.rejected.includes("submitted"), false);
});
