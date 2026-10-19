import { randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "./security.mjs";
import { LEARNER_IDS, validLearner } from "./learners.mjs";

export const isManager = (role) => role === "admin" || role === "parent";
function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
export function initializeAccounts(family, now = Date.now()) {
  family.accounts ||= [];
  for (const [username, role, learnerId] of [
    ["admin", "admin", null],
    ...LEARNER_IDS.flatMap((id) => [
      [id, "student", id],
      [`${id}parent`, "parent", id],
    ]),
  ])
    if (!family.accounts.some((a) => a.username === username))
      family.accounts.push({
        id: username,
        username,
        role,
        learnerId,
        enabled: true,
        version: 1,
        passwordHash: role === "admin" ? family.settings.passwordHash : null,
        defaultPassword:
          role === "admin" ? family.settings.defaultPassword : true,
        createdAt: now,
      });
}
export function publicAccount(a) {
  return {
    id: a.id,
    username: a.username,
    role: a.role,
    learnerId: a.learnerId,
    enabled: a.enabled,
    defaultPassword: a.defaultPassword,
    needsPassword: !a.passwordHash,
  };
}
export const accountList = (family) => family.accounts.map(publicAccount);
export function loginAccount(family, username, password) {
  const name = String(username || "")
    .trim()
    .toLowerCase();
  const a = family.accounts.find((a) => a.username === name);
  const matches = verifyPassword(
    String(password || "").slice(0, 300),
    a?.passwordHash || family.settings.passwordHash,
  );
  return a?.enabled && a.passwordHash && matches ? a : null;
}
export function resolveAccountSession(family, session) {
  if (!session) return null;
  // Keep an existing administrator signed in; anonymous paired child cookies expire here.
  if (!session.accountId) {
    const a = family.accounts.find((a) => a.id === "admin");
    return session.role === "admin" &&
      session.v === family.settings.authVersion &&
      a?.enabled &&
      a.role === "admin" &&
      validLearner(session.learnerId || "oliver")
      ? {
          ...session,
          role: "admin",
          accountId: a.id,
          accountVersion: a.version,
          learnerId: session.learnerId || "oliver",
          account: a,
        }
      : null;
  }
  const a = family.accounts.find((a) => a.id === session.accountId);
  if (
    !a?.enabled ||
    session.accountVersion !== a.version ||
    session.role !== a.role
  )
    return null;
  const learnerId = session.learnerId;
  if (
    !validLearner(learnerId) ||
    (a.role !== "admin" && a.learnerId !== learnerId)
  )
    return null;
  return { ...session, account: a };
}
export function manageAccount(family, input, actorId, now = Date.now()) {
  const existing = input.id
    ? family.accounts.find((a) => a.id === input.id)
    : null;
  if (input.id && !existing) fail("Account not found.", 404);
  const username = String(input.username ?? existing?.username ?? "")
    .trim()
    .toLowerCase();
  const role = input.role ?? existing?.role;
  const learnerId =
    role === "admin" ? null : (input.learnerId ?? existing?.learnerId);
  const enabled =
    input.enabled === undefined ? (existing?.enabled ?? true) : input.enabled;
  if (!/^[a-z][a-z0-9_-]{2,31}$/.test(username))
    fail("Use 3–32 letters, numbers, underscores or dashes for the username.");
  if (
    family.accounts.some(
      (a) => a.id !== existing?.id && a.username === username,
    )
  )
    fail("That username is already in use.", 409);
  if (
    !["admin", "parent", "student"].includes(role) ||
    (role !== "admin" && !validLearner(learnerId))
  )
    fail("Choose a role and an existing learner.");
  if (typeof enabled !== "boolean")
    fail("Choose whether this account is enabled.");
  if (
    (!existing && role === "admin") ||
    (existing?.role === "admin" &&
      (role !== "admin" || !enabled || username !== existing.username)) ||
    (existing?.role !== "admin" && role === "admin")
  )
    fail(
      "The administrator account must stay enabled with its administrator role.",
    );
  const password = input.password;
  if (
    password !== undefined &&
    password !== "" &&
    (typeof password !== "string" ||
      password.length < 8 ||
      password.length > 200)
  )
    fail("Choose a password with 8–200 characters.");
  if (!existing && !password) fail("Set a password for the new account.");
  const a = existing || {
    id: randomUUID(),
    createdAt: now,
    version: 1,
    passwordHash: null,
    defaultPassword: false,
  };
  const credentialsChanged =
    !!password ||
    a.username !== username ||
    a.role !== role ||
    a.learnerId !== learnerId ||
    a.enabled !== enabled;
  Object.assign(a, { username, role, learnerId, enabled });
  if (password) {
    a.passwordHash = hashPassword(password);
    a.defaultPassword = false;
  }
  if (existing && credentialsChanged) a.version++;
  a.updatedAt = now;
  if (!existing) family.accounts.push(a);
  if (a.id === "admin" && credentialsChanged) {
    family.settings.passwordHash = a.passwordHash;
    family.settings.authVersion++;
    family.settings.defaultPassword = false;
  }
  return {
    ok: true,
    account: publicAccount(a),
    reauthenticate: a.id === actorId && credentialsChanged,
  };
}
export function exportForAccount(family, session) {
  if (session.role === "admin") {
    const { settings, accounts, loginLimits, ...data } = family;
    return {
      ...data,
      settings: { timezone: settings.timezone },
      accounts: accountList(family),
    };
  }
  const record =
    session.learnerId === "oliver"
      ? family
      : family.learners[session.learnerId];
  const keys = [
    "profile",
    "stars",
    "sessions",
    "legacy",
    "legacyEvents",
    "legacyCompletions",
    "completions",
    "redemptions",
    "storyProgress",
    "learningProgram",
    "dailyPlans",
    "consistencyAwards",
    "assignments",
    "rewards",
    "dash",
    "chess",
  ];
  return {
    version: family.version,
    learnerId: session.learnerId,
    settings: { timezone: family.settings.timezone },
    ...Object.fromEntries(keys.map((k) => [k, record[k]])),
  };
}
