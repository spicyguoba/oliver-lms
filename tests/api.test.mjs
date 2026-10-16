import test from "node:test";
import assert from "node:assert/strict";
const base = process.env.LMS_TEST_URL || "http://127.0.0.1:3001";
let cookie = "";
async function request(route, body, custom = {}) {
  const r = await fetch(base + "/api/" + route, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Origin: base,
      "Content-Type": "application/json",
      Cookie: cookie,
      ...custom,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return r;
}
test("HTTP access boundaries, CSRF, child pairing and server-owned scoring", async () => {
  assert.equal((await request("admin")).status, 401);
  assert.equal(
    (
      await request(
        "login",
        { username: "admin", password: "admin1234" },
        { Origin: "https://other.example" },
      )
    ).status,
    403,
  );
  const login = await request("login", {
    username: "admin",
    password: "admin1234",
  });
  assert.equal(login.status, 200);
  cookie = login.headers.get("set-cookie").split(";")[0];
  const admin = await (await request("admin")).json();
  assert.ok(!JSON.stringify(admin).includes("passwordHash"));
  const s = await (
    await request("session/start", { skill: "regrouping", mode: "observed" })
  ).json();
  assert.equal(s.mode, "observed");
  assert.ok(!("answer" in s.question));
  const wrong = await (
    await request("session/" + s.id + "/answer", {
      questionId: s.question.id,
      answer: "999999",
      correct: true,
      stars: 999999,
      activeMs: 1000,
    })
  ).json();
  assert.equal(wrong.feedback.correct, false);
  const repeat = await (
    await request("session/" + s.id + "/answer", {
      questionId: s.question.id,
      answer: "0",
      correct: true,
    })
  ).json();
  assert.deepEqual(repeat.feedback, wrong.feedback);
  const details = await (await request("admin")).json();
  const history = details.history.find((x) => x.id === s.id);
  assert.equal(history.attempts.length, 1);
  assert.equal(history.attempts[0].correct, false);
  assert.equal(details.stars, 0);
  const launched = await request("launch", {});
  const cookies = launched.headers.getSetCookie();
  cookie = cookies.find((c) => c.startsWith("oliver-child=")).split(";")[0];
  assert.equal((await request("admin")).status, 401);
  assert.equal(
    (await request("admin/profile", { name: "changed" })).status,
    401,
  );
  assert.equal((await request("admin/export")).status, 401);
  const state = await (await request("state")).json();
  assert.equal(state.role, "child");
  assert.equal(state.profile.name, "Oliver");
  const attempt = await (
    await request("session/start", { skill: "science", mode: "observed" })
  ).json();
  assert.equal(attempt.mode, "practice");
  assert.equal((await request("game/math")).status, 200);
  assert.equal(
    (await request("admin/materials/import", { files: [] })).status,
    401,
  );
  const relogin = await request("login", {
    username: "admin",
    password: "admin1234",
  });
  cookie = relogin.headers.get("set-cookie").split(";")[0];
  const expanded = (await (await request("admin")).json()).stats;
  assert.equal(expanded.length, 27);
  assert.ok(expanded.every((s) => !("questions" in s)));
  for (const [skill, difficulty] of [
    ["space", 1],
    ["china-early", 1],
    ["states", 5],
  ]) {
    const started = await request("session/start", { skill, difficulty });
    assert.equal(started.status, 200);
    const activity = await started.json();
    assert.ok(activity.question.options.length >= 3);
    assert.ok(!("answer" in activity.question));
    if (skill === "states")
      assert.ok(
        /South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming/.test(
          activity.question.prompt,
        ),
      );
    assert.equal(
      (await request("session/" + activity.id + "/leave", {})).status,
      200,
    );
  }
  await request("admin/assignment", {
    id: "test-quest",
    title: "Test paper practice",
    stars: 4,
    days: [1],
  });
  await request("assignment/request", { id: "test-quest" });
  await request("assignment/request", { id: "test-quest" });
  let report = await (await request("admin")).json();
  assert.equal(report.completions.length, 1);
  const completion = report.completions[0];
  await Promise.all([
    request("admin/approve", { id: completion.id, approve: true }),
    request("admin/approve", { id: completion.id, approve: true }),
  ]);
  report = await (await request("admin")).json();
  assert.equal(report.stars, 4);
  await request("admin/reward", {
    id: "test-reward",
    title: "Test family activity",
    cost: 3,
  });
  const requests = await Promise.all([
    request("redeem", { id: "test-reward" }),
    request("redeem", { id: "test-reward" }),
  ]);
  assert.deepEqual(requests.map((r) => r.status).sort(), [200, 400]);
  report = await (await request("admin")).json();
  assert.equal(report.stars, 1);
  assert.equal(report.redemptions.length, 1);
  const reward = report.redemptions[0];
  await Promise.all([
    request("admin/approve", { id: reward.id, approve: false }),
    request("admin/approve", { id: reward.id, approve: false }),
  ]);
  report = await (await request("admin")).json();
  assert.equal(report.stars, 4);
});
