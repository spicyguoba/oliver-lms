import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "../lib/store.mjs";
import { migrateFamily } from "../lib/migrations.mjs";
import {
  manageAccount,
  loginAccount,
  resolveAccountSession,
  exportForAccount,
  accountList,
} from "../lib/accounts.mjs";
const token = (a, learnerId = a.learnerId || "oliver") => ({
  accountId: a.id,
  accountVersion: a.version,
  role: a.role,
  learnerId,
});
test("renaming an account and resetting its password keep its stable ID, learner and history while revoking old logins", () => {
  const d = seed();
  manageAccount(d, { id: "test1", password: "initial-test-password" }, "admin");
  const a = d.accounts.find((a) => a.id === "test1"),
    before = token(a);
  d.learners.test1.stars = 47;
  const history = structuredClone(d.learners);
  manageAccount(
    d,
    { id: a.id, username: "test-one", password: "updated-test-password" },
    "admin",
  );
  assert.equal(a.id, "test1");
  assert.equal(a.learnerId, "test1");
  assert.equal(resolveAccountSession(d, before), null);
  assert.equal(loginAccount(d, "test1", "initial-test-password"), null);
  assert.equal(loginAccount(d, "test-one", "initial-test-password"), null);
  assert.equal(
    loginAccount(d, "test-one", "updated-test-password").id,
    "test1",
  );
  assert.deepEqual(d.learners, history);
  assert.throws(
    () => manageAccount(d, { id: "test2", username: "TEST-ONE" }, "admin"),
    /already in use/,
  );
  const hash = a.passwordHash,
    version = a.version;
  manageAccount(d, { id: a.id, password: "" }, "admin");
  assert.equal(a.passwordHash, hash);
  assert.equal(a.version, version);
});

test("schema seven creates role metadata without changing any learning records or existing admin password", () => {
  const d = seed();
  d.version = 6;
  delete d.accounts;
  d.stars = 19;
  const before = structuredClone(d);
  migrateFamily(d);
  assert.equal(d.version, 9);
  assert.equal(d.accounts.length, 7);
  assert.deepEqual(
    { ...d, version: 6, accounts: undefined },
    { ...before, accounts: undefined },
  );
  assert.equal(
    d.accounts.find((a) => a.id === "admin").passwordHash,
    before.settings.passwordHash,
  );
  assert.ok(
    d.accounts
      .filter((a) => a.role !== "admin")
      .every((a) => a.passwordHash === null),
  );
  const after = structuredClone(d);
  migrateFamily(d);
  assert.deepEqual(d, after);
});
test("only a matching enabled account and current role, learner and version authenticate", () => {
  const d = seed();
  manageAccount(d, { id: "test1", password: "test-password-one" }, "admin");
  const a = loginAccount(d, " Test1 ", "test-password-one");
  assert.ok(a);
  const t = token(a);
  assert.equal(resolveAccountSession(d, t).account.id, a.id);
  assert.equal(resolveAccountSession(d, { ...t, learnerId: "oliver" }), null);
  assert.equal(resolveAccountSession(d, { ...t, role: "admin" }), null);
  assert.equal(resolveAccountSession(d, { ...t, accountVersion: 0 }), null);
  assert.equal(
    resolveAccountSession(d, {
      role: "child",
      v: d.settings.childVersion,
      learnerId: "test1",
    }),
    null,
  );
  assert.ok(
    resolveAccountSession(d, { role: "admin", v: d.settings.authVersion }),
  );
  manageAccount(d, { id: a.id, enabled: false }, "admin");
  assert.equal(resolveAccountSession(d, t), null);
  assert.equal(loginAccount(d, "test1", "test-password-one"), null);
  manageAccount(
    d,
    { id: a.id, enabled: true, password: "replacement-password" },
    "admin",
  );
  assert.equal(loginAccount(d, "test1", "test-password-one"), null);
  assert.ok(loginAccount(d, "test1", "replacement-password"));
});
test("parent exports contain just their student; admin exports contain no authentication hashes", () => {
  const d = seed();
  d.stars = 13;
  d.learners.test1.stars = 27;
  d.learners.test2.stars = 41;
  const session = token(d.accounts.find((a) => a.id === "test1parent"));
  const parent = exportForAccount(d, session);
  assert.equal(parent.stars, 27);
  assert.equal(parent.profile.name, "Test1");
  for (const field of ["accounts", "learners", "loginLimits"])
    assert.ok(!(field in parent));
  assert.ok(!JSON.stringify(parent).includes("passwordHash"));
  const admin = exportForAccount(d, { role: "admin" });
  assert.equal(admin.learners.test2.stars, 41);
  assert.equal(admin.accounts.length, 7);
  assert.ok(!JSON.stringify(admin).includes("passwordHash"));
  assert.ok(!JSON.stringify(accountList(d)).includes("passwordHash"));
});
test("admin controls account roles, links, disable and passwords without modifying learner progress", () => {
  const d = seed(),
    before = structuredClone(d.learners);
  const created = manageAccount(
    d,
    {
      username: "anotherparent",
      role: "parent",
      learnerId: "test2",
      enabled: true,
      password: "another-test-password",
    },
    "admin",
  );
  const a = d.accounts.find((a) => a.id === created.account.id),
    old = token(a);
  manageAccount(d, { id: a.id, role: "student", learnerId: "test1" }, "admin");
  assert.equal(resolveAccountSession(d, old), null);
  assert.deepEqual(d.learners, before);
  assert.throws(() =>
    manageAccount(d, { id: "admin", enabled: false }, "admin"),
  );
  assert.throws(() =>
    manageAccount(
      d,
      { id: "admin", role: "student", learnerId: "oliver" },
      "admin",
    ),
  );
  assert.throws(() => manageAccount(d, { id: a.id, role: "admin" }, "admin"));
  assert.throws(() =>
    manageAccount(
      d,
      {
        username: "anotherparent",
        role: "parent",
        learnerId: "oliver",
        password: "test-password",
      },
      "admin",
    ),
  );
  const legacy = { role: "admin", v: d.settings.authVersion };
  manageAccount(d, { id: "admin", password: "new-admin-password" }, "admin");
  assert.equal(resolveAccountSession(d, legacy), null);
  assert.ok(loginAccount(d, "admin", "new-admin-password"));
});
