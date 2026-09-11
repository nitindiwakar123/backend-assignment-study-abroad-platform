const test = require("node:test");
const assert = require("node:assert/strict");
const { escapedRegex, parse, programQuery, registerBody } = require("../src/validators/requestSchemas");

test("Zod rejects an overlarge catalogue page size", () => {
  assert.throws(() => parse(programQuery, { page: "2", limit: "500" }), { statusCode: 400 });
});

test("Zod rejects unexpected registration fields before controller use", () => {
  assert.throws(
    () => parse(registerBody, { fullName: "Aarav", email: "aarav@example.com", password: "Candidate123!", role: "counselor" }),
    { statusCode: 400 }
  );
});

test("search terms are escaped instead of becoming executable regex", () => {
  assert.equal(escapedRegex("(a+)+$").test("aaaaaaaaaaaa!"), false);
  assert.equal(escapedRegex("C++").test("C++"), true);
});
