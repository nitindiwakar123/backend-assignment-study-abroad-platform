const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/app");

async function withServer(run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

test("health API flow returns a stable response envelope", async () => withServer(async (base) => {
  const response = await fetch(`${base}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.status, "ok");
}));

test("unknown API route returns a safe 404 edge-case response", async () => withServer(async (base) => {
  const response = await fetch(`${base}/api/not-real`);
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.match(body.message, /Route not found/);
}));
