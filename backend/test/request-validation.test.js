const test = require("node:test");
const assert = require("node:assert/strict");
const { escapedRegex, page } = require("../src/utils/request");

test("pagination rejects an overlarge catalogue page size", () => {
  assert.throws(() => page({ page: "2", limit: "500" }), { statusCode: 400 });
});

test("search terms are escaped instead of becoming executable regex", () => {
  assert.equal(escapedRegex("(a+)+$").test("aaaaaaaaaaaa!"), false);
  assert.equal(escapedRegex("C++").test("C++"), true);
});
