import test from "node:test";
import assert from "node:assert/strict";
import { api } from "../lib/client-api.mjs";

test("editing another account never replaces the signed-in admin's request identity", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  const calls = [];
  const replies = [
    { learnerId: "oliver", account: { id: "admin" } },
    {
      ok: true,
      account: { id: "test2", username: "new-name", learnerId: "test2" },
    },
    { learnerId: "oliver", account: { id: "admin" } },
    { ok: true },
    { learnerId: "test1", account: { id: "test1" } },
    { learnerId: "test1", account: { id: "test1" } },
  ];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...structuredClone(options) });
    return new Response(JSON.stringify(replies.shift()), { status: 200 });
  };
  await api("admin");
  await api("admin/account", { id: "test2", username: "new-name" });
  await api("admin");
  assert.equal(calls[1].headers["x-lms-account"], "admin");
  assert.equal(calls[2].headers["x-lms-account"], "admin");
  assert.equal(calls[2].headers["x-lms-learner"], "oliver");
  await api("login", {
    username: "test1",
    password: "synthetic-test-password",
  });
  await api("state");
  assert.equal(calls[4].headers["x-lms-account"], undefined);
  await api("state");
  assert.equal(calls[5].headers["x-lms-account"], "test1");
  assert.equal(calls[5].headers["x-lms-learner"], "test1");
});
