import test from "node:test";
import assert from "node:assert/strict";
import { skills } from "../lib/questions.mjs";
import { pilot } from "./dash-helper.mjs";
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
  assert.equal((await request("calendar")).status, 401);
  assert.equal((await request("lesson/en-words-001")).status, 401);
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
  assert.equal(state.dailyPlan.slots.length, 5);
  assert.deepEqual(
    (await (await request("state")).json()).dailyPlan,
    state.dailyPlan,
  );
  assert.equal((await request("calendar?month=2026-99")).status, 400);
  assert.equal(
    (await request("daily/start", { day: "2000-01-01", slot: 0 })).status,
    400,
  );
  assert.equal(
    (await request("daily/start", { day: state.today, slot: -1 })).status,
    400,
  );
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
  assert.equal(expanded.length, Object.keys(skills).length);
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
  assert.equal(report.stars, 6);
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
  assert.equal(report.stars, 3);
  assert.equal(report.redemptions.length, 1);
  const reward = report.redemptions[0];
  await Promise.all([
    request("admin/approve", { id: reward.id, approve: false }),
    request("admin/approve", { id: reward.id, approve: false }),
  ]);
  report = await (await request("admin")).json();
  assert.equal(report.stars, 6);
  const beforeLesson = report.history.length;
  const lesson = await (await request("lesson/zh-usage-001")).json();
  assert.equal(lesson.cards.length, 20);
  assert.ok(
    lesson.cards.every(
      (c) => c.pinyin && c.meaning && c.sentence && c.translation,
    ),
  );
  assert.equal((await request("lesson/missing-pack")).status, 404);
  assert.equal(
    (await (await request("admin")).json()).history.length,
    beforeLesson,
  );
  const legacyId = "abcdefab-1234-5678-abcd-123456789abc";
  const legacyBody = {
    game: "reading",
    completion: { id: legacyId, correct: 3, total: 5 },
  };
  await Promise.all([
    request("legacy", legacyBody),
    request("legacy", legacyBody),
  ]);
  const exportData = await (await request("admin/export")).json();
  assert.equal(exportData.version, 5);
  assert.equal(
    exportData.legacyCompletions.filter((c) => c.id === legacyId).length,
    1,
  );
  assert.equal(exportData.stars, 6);
  assert.equal(
    (
      await request("legacy", {
        game: "reading",
        completion: { id: legacyId, correct: 99, total: 5 },
      })
    ).status,
    400,
  );
  const progressState = await (await request("state")).json();
  assert.equal(progressState.legacyProgress.reading.correct, 3);
  assert.equal(progressState.legacyProgress.reading.total, 5);
  assert.ok(progressState.legacyProgress.reading.date);
  let round = await (
      await request("session/start", { skill: "en-usage-001" })
    ).json(),
    score = 0;
  for (let i = 0; i < 5; i++) {
    assert.ok(round.question.context.includes("____"));
    assert.ok(!("answer" in round.question));
    const answered = await (
      await request(`session/${round.id}/answer`, {
        questionId: round.question.id,
        answer: "0",
        activeMs: 1500,
      })
    ).json();
    if (answered.feedback.correct) score++;
    round = await (await request(`session/${round.id}/next`, {})).json();
  }
  assert.ok(round.finishedAt);
  const completed = await (await request("state")).json(),
    card = completed.stats.find((s) => s.id === "en-usage-001");
  assert.deepEqual(card.lastCompletion, {
    date: round.finishedAt,
    correct: score,
    total: 5,
  });
  assert.equal(card.completedRounds, 1);
  assert.equal(completed.stars, 6 + score);
  await request(`session/${round.id}/next`, {});
  const again = await (await request("state")).json();
  assert.equal(again.stars, completed.stars);
  assert.equal(
    again.stats.find((s) => s.id === "en-usage-001").completedRounds,
    1,
  );
  const beforeFive = again.stars;
  let dailyScore = 0;
  for (let slot = 0; slot < 5; slot++) {
    const starts = await Promise.all([
      request("daily/start", {
        day: again.today,
        slot,
        stars: 99999,
        difficulty: 5,
      }),
      request("daily/start", { day: again.today, slot }),
    ]);
    let current = await starts[0].json();
    assert.equal(current.id, (await starts[1].json()).id);
    for (let i = 0; i < 5; i++) {
      const answer = current.question.options ? "0" : "999999";
      const answered = await (
        await request(`session/${current.id}/answer`, {
          questionId: current.question.id,
          answer,
        })
      ).json();
      dailyScore += Number(answered.feedback.correct);
      const next = await Promise.all([
        request(`session/${current.id}/next`, {}),
        request(`session/${current.id}/next`, {}),
      ]);
      current = await next[0].json();
      assert.equal((await next[1].json()).index, current.index);
    }
  }
  const final = await (await request("state")).json();
  assert.ok(final.dailyPlan.slots.every((s) => s.completed));
  assert.equal(final.stars, beforeFive + dailyScore + 5);
  await request("daily/start", { day: final.today, slot: 0 });
  assert.equal((await (await request("state")).json()).stars, final.stars);
  const calendar = await (await request("calendar")).json();
  assert.ok(
    calendar.days
      .find((d) => d.day === final.today)
      .events.some(
        (e) => e.type === "bonus" && e.title === "Today's five finished",
      ),
  );
  assert.ok(
    calendar.days.flatMap((d) => d.events).some((e) => e.attempts?.length),
  );
  const paired = await request("launch", {});
  cookie = paired.headers
    .getSetCookie()
    .find((c) => c.startsWith("oliver-child="))
    .split(";")[0];
  const childCalendar = await (await request("calendar")).json();
  assert.ok(
    childCalendar.days
      .flatMap((d) => d.events)
      .every((e) => !("attempts" in e)),
  );
});

test("three learner profiles isolate all progress, cookies, stale tabs, approvals and legacy saves", async () => {
  const login = await request("login", {
    username: "admin",
    password: "admin1234",
  });
  cookie = login.headers
    .getSetCookie()
    .find((c) => c.startsWith("oliver-admin="))
    .split(";")[0];
  const before = await (await request("admin/export")).json();
  const rootOnly = ({ learners, loginLimits, ...rest }) => rest;
  const rootStars = before.stars,
    rootId = before.sessions[0].id;
  async function select(id, role = "admin") {
    const r = await request("learner/select", { id });
    assert.equal(r.status, 200);
    cookie = r.headers
      .getSetCookie()
      .find((c) => c.startsWith(`oliver-${role}=`))
      .split(";")[0];
  }
  await select("test1");
  let state = await (await request("admin")).json();
  assert.equal(state.learnerId, "test1");
  assert.equal(state.profile.name, "Test1");
  assert.equal(state.stars, 0);
  assert.equal(state.history.length, 0);
  assert.deepEqual(
    state.learners.map((x) => x.id),
    ["oliver", "test1", "test2"],
  );
  assert.equal((await request("session/" + rootId)).status, 404);
  assert.equal(
    (await request("state", undefined, { "x-lms-learner": "oliver" })).status,
    409,
  );
  assert.equal(
    (await request("redeem", { id: "test-reward", learnerId: "oliver" }))
      .status,
    409,
  );
  assert.equal(
    (await request("learner/select", { id: "__proto__" })).status,
    400,
  );
  assert.equal(
    (
      await request(
        "learner/select",
        { id: "test2" },
        { Origin: "https://other.example" },
      )
    ).status,
    403,
  );
  await request("admin/profile", {
    name: "Test1",
    age: 8,
    grade: "3",
    dailyGoal: 10,
  });
  let round = await (
    await request("session/start", { skill: "regrouping" })
  ).json();
  const testSessionId = round.id;
  for (let i = 0; i < 5; i++) {
    await request(`session/${round.id}/answer`, {
      questionId: round.question.id,
      answer: "999999",
    });
    round = await (await request(`session/${round.id}/next`, {})).json();
  }
  assert.equal((await (await request("state")).json()).stars, 2);
  await request("admin/assignment", {
    id: "test1-only",
    title: "Test1 quest",
    stars: 4,
    days: [1],
  });
  await request("assignment/request", { id: "test1-only" });
  const pending = (await (await request("admin")).json()).completions[0];
  await request("admin/approve", { id: pending.id, approve: true });
  await request("admin/reward", {
    id: "test1-only",
    title: "Test1 reward",
    cost: 1,
  });
  await request("redeem", { id: "test1-only" });
  const legacy = {
    game: "reading",
    saved: {
      "reading-rangers-v1": JSON.stringify({
        stars: 3,
        best: { "0-0": 3 },
        attempts: {},
        unlocked: {},
      }),
    },
    completion: {
      id: "11111111-2222-3333-4444-555555555555",
      correct: 3,
      total: 5,
    },
  };
  assert.equal((await request("legacy", legacy)).status, 409);
  assert.equal(
    (await request("legacy", { ...legacy, learnerId: "test1" })).status,
    200,
  );
  await select("test2");
  state = await (await request("admin")).json();
  assert.equal(state.stars, 0);
  assert.equal(state.history.length, 0);
  assert.equal(state.completions.length, 0);
  assert.equal(state.redemptions.length, 0);
  assert.ok(!state.assignments.some((a) => a.id === "test1-only"));
  assert.ok(!state.rewards.some((r) => r.id === "test1-only"));
  assert.equal(state.legacyProgress.reading, null);
  assert.equal((await request("session/" + testSessionId)).status, 404);
  const calendar = await (await request("calendar")).json();
  assert.equal(calendar.days.length, 0);
  await request("admin/approve", { id: pending.id, approve: true });
  assert.equal((await (await request("state")).json()).stars, 0);
  await select("test1");
  state = await (await request("admin")).json();
  assert.equal(state.profile.age, 8);
  assert.equal(state.stars, 5);
  assert.equal(state.history[0].attempts.length, 5);
  assert.equal(state.legacyProgress.reading.correct, 3);
  const paired = await request("launch", {});
  cookie = paired.headers
    .getSetCookie()
    .find((c) => c.startsWith("oliver-child="))
    .split(";")[0];
  assert.equal((await (await request("state")).json()).learnerId, "test1");
  assert.equal((await request("admin")).status, 401);
  await select("test2", "child");
  assert.equal((await (await request("state")).json()).role, "child");
  assert.equal(
    (await request("admin/profile", { name: "changed" })).status,
    401,
  );
  await select("oliver", "child");
  assert.equal((await (await request("state")).json()).stars, rootStars);
  const relogin = await request("login", {
    username: "admin",
    password: "admin1234",
  });
  cookie = relogin.headers
    .getSetCookie()
    .find((c) => c.startsWith("oliver-admin="))
    .split(";")[0];
  const after = await (await request("admin/export")).json();
  assert.deepEqual(rootOnly(after), rootOnly(before));
  assert.equal(after.learners.test1.stars, 5);
  assert.equal(after.learners.test2.stars, 0);
});

test("Star Dash HTTP gates the question behind a verified clear and awards its star once in the right profile", async () => {
  assert.equal((await request("dash", undefined, { Cookie: "" })).status, 401);
  const rootStars = (await (await request("state")).json()).stars;
  const selected = await request("learner/select", { id: "test2" });
  cookie = selected.headers
    .getSetCookie()
    .find((c) => c.startsWith("oliver-admin="))
    .split(";")[0];
  assert.equal((await request("dash/start", { level: 20 })).status, 400);
  let run = await (
    await request("dash/start", { level: 1, stars: 9999 })
  ).json();
  assert.equal(run.learnerId, "test2");
  assert.equal(run.question, null);
  const p = pilot(1, run.seed);
  assert.equal(
    (
      await request("dash/answer", {
        id: run.id,
        questionId: "fake",
        answer: "0",
      })
    ).status,
    400,
  );
  assert.equal(
    (await request("dash/finish", { id: run.id, jumps: p.jumps })).status,
    400,
  );
  await new Promise((resolve) =>
    setTimeout(resolve, (p.course.durationFrames / 60) * 1000 + 50),
  );
  assert.equal(
    (await request("dash/finish", { id: run.id, jumps: [] })).status,
    400,
  );
  const finishes = await Promise.all([
    request("dash/finish", { id: run.id, jumps: p.jumps }),
    request("dash/finish", { id: run.id, jumps: p.jumps }),
  ]);
  run = await finishes[0].json();
  assert.equal(run.question.id, (await finishes[1].json()).question.id);
  assert.ok(!("answer" in run.question));
  assert.ok(!("explanation" in run.question));
  const [a, operator, b] = run.question.prompt.split(" ");
  const answer = String(
    operator === "+" ? Number(a) + Number(b) : Number(a) - Number(b),
  );
  const results = await Promise.all([
    request("dash/answer", {
      id: run.id,
      questionId: run.question.id,
      answer,
      stars: 9999,
    }),
    request("dash/answer", { id: run.id, questionId: run.question.id, answer }),
  ]);
  const feedback = await results[0].json();
  assert.equal(feedback.feedback.stars, 1);
  assert.deepEqual((await results[1].json()).feedback, feedback.feedback);
  const state = await (await request("dash")).json();
  assert.equal(state.stars, 3);
  assert.equal(state.unlocked, 2);
  assert.equal(state.pending, null);
  assert.equal(
    (await (await request("admin")).json()).dashHistory[0].attempt.correct,
    true,
  );
  const calendar = await (await request("calendar")).json();
  assert.ok(
    calendar.days
      .flatMap((d) => d.events)
      .some((e) => e.title.startsWith("Star Dash")),
  );
  const back = await request("learner/select", { id: "oliver" });
  cookie = back.headers
    .getSetCookie()
    .find((c) => c.startsWith("oliver-admin="))
    .split(";")[0];
  assert.equal((await (await request("state")).json()).stars, rootStars);
  assert.equal(
    (await request("dash/finish", { id: run.id, jumps: p.jumps })).status,
    404,
  );
});
