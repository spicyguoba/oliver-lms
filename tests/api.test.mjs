import test from "node:test";
import assert from "node:assert/strict";
import { skills } from "../lib/questions.mjs";
import { peopleBank } from "../lib/explorers.mjs";
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
  const accounts = (await (await request("admin/accounts")).json()).accounts;
  for (const a of accounts.filter((a) => a.role !== "admin"))
    assert.equal(
      (
        await request("admin/account", {
          id: a.id,
          password: `isolated-${a.username}-password`,
        })
      ).status,
      200,
    );
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
  assert.equal(state.role, "student");
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
  assert.equal(report.stars, 4);
  assert.equal(report.streak.goalStars, 21);
  assert.equal(report.streak.todayStars, 4);
  assert.equal(report.streak.todayComplete, false);
  await request("admin/reward", {
    id: "test-reward",
    title: "Test family activity",
    cost: 3,
  });
  const requests = await Promise.all([
    request("redeem", { id: "test-reward" }),
    request("redeem", { id: "test-reward" }),
  ]);
  assert.deepEqual(requests.map((r) => r.status).sort(), [200, 409]);
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
  // A daily reward stays claimed today after approval/completion; requests are atomic.
  await request("admin/reward", {
    id: "daily-http",
    title: "Daily shared story",
    cost: 1,
    daily: true,
  });
  const dailyRequests = await Promise.all([
    request("redeem", { id: "daily-http" }),
    request("redeem", { id: "daily-http" }),
  ]);
  assert.deepEqual(dailyRequests.map((r) => r.status).sort(), [200, 409]);
  report = await (await request("admin")).json();
  const dailyRecord = report.redemptions.find(
    (r) => r.rewardId === "daily-http",
  );
  await request("admin/redemption", {
    id: dailyRecord.id,
    action: "complete",
    completedDay: report.today,
  });
  assert.equal((await request("redeem", { id: "daily-http" })).status, 409);
  const todayShop = await (await request("state")).json();
  assert.equal(
    todayShop.rewards.find((r) => r.id === "daily-http").available,
    false,
  );
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
  assert.equal(exportData.version, 9);
  assert.equal(
    exportData.legacyCompletions.filter((c) => c.id === legacyId).length,
    1,
  );
  assert.equal(exportData.stars, 3);
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
  assert.equal(completed.stars, 3 + score);
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
  assert.equal(
    final.stars,
    beforeFive +
      dailyScore +
      5 +
      (final.streak.todayComplete && !again.streak.todayComplete ? 2 : 0),
  );
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
  assert.equal((await (await request("state")).json()).stars, 0);
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
  assert.equal(state.stars, 3);
  assert.equal(state.history[0].attempts.length, 5);
  assert.equal(state.legacyProgress.reading.correct, 3);
  const paired = await request("launch", {});
  cookie = paired.headers
    .getSetCookie()
    .find((c) => c.startsWith("oliver-child="))
    .split(";")[0];
  assert.equal((await (await request("state")).json()).learnerId, "test1");
  assert.equal((await request("admin")).status, 401);
  assert.equal((await request("learner/select", { id: "test2" })).status, 403);
  const test2login = await request("login", {
    username: "test2",
    password: "isolated-test2-password",
  });
  cookie = test2login.headers
    .getSetCookie()
    .find(
      (c) => c.startsWith("oliver-child=") && !c.startsWith("oliver-child=;"),
    )
    .split(";")[0];
  assert.equal((await (await request("state")).json()).role, "student");
  assert.equal(
    (await request("admin/profile", { name: "changed" })).status,
    401,
  );
  assert.equal((await request("learner/select", { id: "oliver" })).status, 403);
  const relogin = await request("login", {
    username: "admin",
    password: "admin1234",
  });
  cookie = relogin.headers
    .getSetCookie()
    .find((c) => c.startsWith("oliver-admin="))
    .split(";")[0];
  const after = await (await request("admin/export")).json();
  assert.equal(after.stars, rootStars);
  assert.deepEqual(rootOnly(after), rootOnly(before));
  assert.equal(after.learners.test1.stars, 3);
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
    (await request("dash/finish", { id: run.id, inputs: p.inputs })).status,
    400,
  );
  await new Promise((resolve) =>
    setTimeout(resolve, (p.course.durationFrames / 60) * 1000 + 50),
  );
  assert.equal(
    (await request("dash/finish", { id: run.id, inputs: [] })).status,
    400,
  );
  const finishes = await Promise.all([
    request("dash/finish", { id: run.id, inputs: p.inputs }),
    request("dash/finish", { id: run.id, inputs: p.inputs }),
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
  assert.equal(state.stars, 1);
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
    (await request("dash/finish", { id: run.id, inputs: p.inputs })).status,
    404,
  );
});

test("parents record reward completion once with private notes; child and other learners cannot change it", async () => {
  const rootStars = (await (await request("state")).json()).stars;
  const select = async (id) => {
    const r = await request("learner/select", { id });
    cookie = r.headers
      .getSetCookie()
      .find((c) => c.startsWith("oliver-admin="))
      .split(";")[0];
  };
  await select("test1");
  const before = (await (await request("admin")).json()).stars;
  await request("admin/reward", {
    id: "completion-test",
    title: "Read a bedtime book",
    cost: 1,
  });
  assert.equal(
    (await request("redeem", { id: "completion-test" })).status,
    200,
  );
  let report = await (await request("admin")).json();
  const r = report.redemptions.find((r) => r.rewardId === "completion-test");
  assert.equal(report.stars, before - 1);
  assert.equal(
    (
      await request("admin/redemption", {
        id: r.id,
        action: "complete",
        completedDay: "2200-01-01",
      })
    ).status,
    400,
  );
  const body = {
    id: r.id,
    action: "complete",
    completedDay: report.today,
    parentNote: "Private parent detail: chose a book together.",
  };
  assert.equal(
    (await request("admin/redemption", body, { "x-lms-learner": "oliver" }))
      .status,
    409,
  );
  assert.equal(
    (await request("admin/redemption", body, { Cookie: "" })).status,
    401,
  );
  const responses = await Promise.all([
    request("admin/redemption", body),
    request("admin/redemption", body),
  ]);
  assert.ok(responses.every((r) => r.status === 200));
  report = await (await request("admin")).json();
  const saved = report.redemptions.find((x) => x.id === r.id);
  assert.equal(saved.status, "completed");
  assert.equal(saved.completedDay, report.today);
  assert.equal(saved.parentNote, body.parentNote);
  assert.ok(saved.completedAt);
  assert.equal(report.stars, before - 1);
  await request("admin/approve", { id: r.id, approve: false });
  assert.equal((await (await request("admin")).json()).stars, before - 1);
  assert.equal(
    (
      await request("admin/redemption", {
        id: r.id,
        action: "note",
        parentNote: "Updated private parent detail",
      })
    ).status,
    200,
  );
  assert.ok(
    JSON.stringify(await (await request("admin/export")).json()).includes(
      "Updated private parent detail",
    ),
  );
  const parentCalendar = await (await request("calendar")).json();
  assert.ok(
    parentCalendar.days
      .flatMap((d) => d.events)
      .some(
        (e) =>
          e.type === "reward" &&
          e.parentNote === "Updated private parent detail",
      ),
  );
  const paired = await request("launch", {});
  cookie = paired.headers
    .getSetCookie()
    .find((c) => c.startsWith("oliver-child="))
    .split(";")[0];
  assert.equal((await request("admin/redemption", body)).status, 401);
  const child = await (await request("state")).json(),
    calendar = await (await request("calendar")).json();
  assert.equal(
    child.redemptions.find((x) => x.id === r.id).status,
    "completed",
  );
  assert.ok(!JSON.stringify(child).includes("parentNote"));
  assert.ok(!JSON.stringify(calendar).includes("private parent"));
  const login = await request("login", {
    username: "admin",
    password: "admin1234",
  });
  cookie = login.headers
    .getSetCookie()
    .find((c) => c.startsWith("oliver-admin="))
    .split(";")[0];
  await select("test2");
  assert.equal(
    (
      await request("admin/redemption", {
        id: r.id,
        action: "note",
        parentNote: "wrong profile",
      })
    ).status,
    404,
  );
  await select("oliver");
  assert.equal((await (await request("state")).json()).stars, rootStars);
});

test("the server awards the daily streak bonus only after reaching 21 study stars", async () => {
  const selected = await request("learner/select", { id: "test2" });
  cookie = selected.headers
    .getSetCookie()
    .find((c) => c.startsWith("oliver-admin="))
    .split(";")[0];
  const before = await (await request("state")).json();
  assert.equal(before.streak.todayStars, 1);
  assert.equal(before.streak.todayComplete, false);
  await request("admin/assignment", {
    id: "reach-goal",
    title: "Study to the daily goal",
    stars: 20,
    days: [1],
  });
  await request("assignment/request", { id: "reach-goal" });
  const pending = (await (await request("admin")).json()).completions.find(
    (c) => c.assignmentId === "reach-goal",
  );
  await Promise.all([
    request("admin/approve", { id: pending.id, approve: true }),
    request("admin/approve", { id: pending.id, approve: true }),
  ]);
  const after = await (await request("state")).json();
  assert.equal(after.streak.todayStars, 21);
  assert.equal(after.streak.todayComplete, true);
  assert.equal(after.stars, before.stars + 20 + 2);
  const calendar = await (await request("calendar")).json(),
    today = calendar.days.find((d) => d.day === after.today);
  assert.equal(today.studyStars, 21);
  assert.equal(today.qualifying, true);
  assert.equal(today.bonusStars, 2);
  assert.equal(today.events.filter((e) => e.type === "bonus").length, 1);
  const back = await request("learner/select", { id: "oliver" });
  cookie = back.headers
    .getSetCookie()
    .find((c) => c.startsWith("oliver-admin="))
    .split(";")[0];
});

test("student, parent and admin logins enforce account isolation, scoped exports and revocation", async () => {
  const signIn = async (
    username,
    password = `isolated-${username}-password`,
  ) => {
    const r = await request("login", { username, password });
    assert.equal(r.status, 200);
    const json = await r.json();
    const bucket = json.role === "student" ? "child" : "admin";
    cookie = r.headers
      .getSetCookie()
      .find(
        (c) =>
          c.startsWith(`oliver-${bucket}=`) &&
          !c.startsWith(`oliver-${bucket}=;`),
      )
      .split(";")[0];
    assert.ok(
      r.headers
        .getSetCookie()
        .some((c) =>
          c.startsWith(`oliver-${bucket === "admin" ? "child" : "admin"}=;`),
        ),
    );
    return json;
  };
  await signIn("admin", "admin1234");
  const all = await (await request("admin/export")).json();
  assert.equal(all.accounts.length, 7);
  assert.ok(!JSON.stringify(all).includes("passwordHash"));
  const ids = {
    oliver: all.sessions[0].id,
    test1: all.learners.test1.sessions[0].id,
  };
  const studentCookies = {};
  for (const id of ["oliver", "test1", "test2"]) {
    const login = await signIn(id);
    assert.equal(login.redirect, "/");
    studentCookies[id] = cookie;
    const state = await (await request("state")).json();
    assert.equal(state.role, "student");
    assert.equal(state.learnerId, id);
    assert.deepEqual(
      state.learners.map((l) => l.id),
      [id],
    );
    assert.equal(
      (
        await request("learner/select", {
          id: id === "oliver" ? "test1" : "oliver",
        })
      ).status,
      403,
    );
    assert.equal((await request("admin")).status, 401);
    assert.equal((await request("admin/export")).status, 401);
    assert.equal((await request("admin/accounts")).status, 403);
    assert.equal(
      (
        await request("admin/account", {
          id: "admin",
          password: "hijack-not-allowed",
        })
      ).status,
      401,
    );
    assert.equal(
      (await request(`session/${ids[id === "oliver" ? "test1" : "oliver"]}`))
        .status,
      404,
    );
    assert.equal(
      (
        await request("state", undefined, {
          "x-lms-learner": id === "oliver" ? "test1" : "oliver",
        })
      ).status,
      409,
    );
    assert.equal(
      (await request("state", undefined, { "x-lms-account": "admin" })).status,
      409,
    );
    const legacy = await (await request("game/reading")).text();
    assert.ok(legacy.includes(`window.__LMS_LEARNER__=${JSON.stringify(id)}`));
  }
  for (const id of ["oliver", "test1", "test2"]) {
    const login = await signIn(`${id}parent`);
    assert.equal(login.redirect, "/admin");
    const report = await (await request("admin")).json();
    assert.equal(report.role, "parent");
    assert.equal(report.learnerId, id);
    assert.deepEqual(
      report.learners.map((l) => l.id),
      [id],
    );
    assert.equal(
      (
        await request("learner/select", {
          id: id === "oliver" ? "test1" : "oliver",
        })
      ).status,
      403,
    );
    assert.equal((await request("admin/accounts")).status, 403);
    assert.equal(
      (await request("admin/account", { id: "test1", enabled: false })).status,
      403,
    );
    assert.equal(
      (await request("admin/materials/import", { files: [] })).status,
      403,
    );
    const exported = await (await request("admin/export")).json();
    assert.equal(exported.learnerId, id);
    for (const key of ["accounts", "learners", "loginLimits"])
      assert.ok(!(key in exported));
    assert.ok(!JSON.stringify(exported).includes("passwordHash"));
    assert.equal(
      (await request(`session/${ids[id === "oliver" ? "test1" : "oliver"]}`))
        .status,
      404,
    );
    const observed = await (
      await request("session/start", { skill: "phonics", mode: "observed" })
    ).json();
    assert.equal(observed.mode, "observed");
    await request(`session/${observed.id}/leave`, {});
  }
  await signIn("test1parent");
  assert.equal((await request("admin/revoke", {})).status, 200);
  assert.equal(
    (await request("state", undefined, { Cookie: studentCookies.test1 }))
      .status,
    401,
  );
  assert.equal(
    (await request("state", undefined, { Cookie: studentCookies.test2 }))
      .status,
    200,
  );
  const parentCookie = cookie;
  await signIn("admin", "admin1234");
  assert.equal(
    (
      await request("admin/account", {
        id: "test1parent",
        password: "replacement-parent-test-password",
      })
    ).status,
    200,
  );
  assert.equal(
    (await request("admin", undefined, { Cookie: parentCookie })).status,
    401,
  );
  assert.equal(
    (
      await request("login", {
        username: "test1parent",
        password: "isolated-test1parent-password",
      })
    ).status,
    401,
  );
  await signIn("test1parent", "replacement-parent-test-password");
  await signIn("admin", "admin1234");
  assert.equal(
    (await request("admin/account", { id: "test2", enabled: false })).status,
    200,
  );
  assert.equal(
    (await request("state", undefined, { Cookie: studentCookies.test2 }))
      .status,
    401,
  );
  assert.equal(
    (
      await request("login", {
        username: "test2",
        password: "isolated-test2-password",
      })
    ).status,
    401,
  );
  assert.equal(
    (await request("admin/account", { id: "test2", enabled: true })).status,
    200,
  );
  assert.equal(
    (await request("admin/account", { id: "admin", enabled: false })).status,
    400,
  );
  assert.equal(
    (
      await request("admin/account", {
        username: "qa-extra-parent",
        role: "parent",
        learnerId: "test2",
        password: "extra-parent-test-password",
        enabled: true,
      })
    ).status,
    200,
  );
  const accounts = await (await request("admin/accounts")).json();
  assert.equal(accounts.accounts.length, 8);
  assert.ok(!JSON.stringify(accounts).includes("passwordHash"));
  const extra = accounts.accounts.find((a) => a.username === "qa-extra-parent");
  await signIn("qa-extra-parent", "extra-parent-test-password");
  const extraCookie = cookie;
  await signIn("admin", "admin1234");
  assert.equal(
    (
      await request("admin/account", {
        id: extra.id,
        username: "qa-renamed-parent",
        password: "renamed-parent-test-password",
      })
    ).status,
    200,
  );
  assert.equal(
    (await request("admin", undefined, { Cookie: extraCookie })).status,
    401,
  );
  assert.equal(
    (
      await request("login", {
        username: "qa-extra-parent",
        password: "extra-parent-test-password",
      })
    ).status,
    401,
  );
  await signIn("qa-renamed-parent", "renamed-parent-test-password");
  assert.equal((await (await request("state")).json()).learnerId, "test2");
  await signIn("admin", "admin1234");
});
test("Chess HTTP validates moves and binds quiz-earned hints/undo to one learner and position", async () => {
  async function loginAs(username, password) {
    const r = await request("login", { username, password });
    assert.equal(r.status, 200);
    return r.headers
      .getSetCookie()
      .find((c) =>
        c.startsWith(
          username === "admin" || username.endsWith("parent")
            ? "oliver-admin="
            : "oliver-child=",
        ),
      )
      .split(";")[0];
  }
  const adminCookie = await loginAs("admin", "admin1234");
  const studentCookie = await loginAs("test2", "isolated-test2-password"),
    parentCookie = await loginAs(
      "test2parent",
      "isolated-test2parent-password",
    );
  const call = (route, body, extra = {}) =>
    request(route, body, { Cookie: studentCookie, ...extra });
  assert.equal((await request("chess", undefined, { Cookie: "" })).status, 401);
  assert.equal(
    (
      await call(
        "chess/start",
        { mode: "computer", difficulty: 2, color: "w" },
        { Origin: "https://other.example" },
      )
    ).status,
    403,
  );
  let state = await (await call("chess")).json();
  const beforeStars = state.stars;
  assert.equal(state.game, null);
  const beforeNative = (
    await (
      await request("admin/export", undefined, { Cookie: parentCookie })
    ).json()
  ).sessions.length;
  state = await (
    await call("chess/start", { mode: "computer", difficulty: 2, color: "w" })
  ).json();
  let g = state.game;
  assert.equal(g.moves.length, 0);
  assert.equal(g.hint, null);
  assert.equal(
    (
      await call("chess/move", {
        id: g.id,
        version: g.version,
        from: "e2",
        to: "e5",
      })
    ).status,
    400,
  );
  const moves = await Promise.all([
    call("chess/move", { id: g.id, version: g.version, from: "e2", to: "e4" }),
    call("chess/move", { id: g.id, version: g.version, from: "e2", to: "e4" }),
  ]);
  assert.deepEqual(moves.map((r) => r.status).sort(), [200, 409]);
  state = await (await call("chess")).json();
  g = state.game;
  assert.equal(g.moves.length, 2);
  const gameId = g.id;
  state = await (
    await call("chess/quiz", { id: g.id, version: g.version, action: "hint" })
  ).json();
  g = state.game;
  const quizId = g.quiz.id;
  assert.ok(!("answer" in g.quiz.question));
  assert.ok(!("explanation" in g.quiz.question));
  assert.equal(g.hint, null);
  assert.equal(
    (
      await call("chess/move", {
        id: g.id,
        version: g.version,
        from: "d2",
        to: "d4",
      })
    ).status,
    409,
  );
  assert.equal(
    (await call("chess/quiz-read", { id: g.id, version: g.version, quizId }))
      .status,
    200,
  );
  const exported = await (
      await request("admin/export", undefined, { Cookie: parentCookie })
    ).json(),
    raw = exported.chess.quizzes.find((q) => q.id === quizId);
  for (let i = 0; i < 3; i++) {
    const q = raw.questions[i],
      answer =
        i === 0
          ? q.options
            ? String((Number(q.answer) + 1) % q.options.length)
            : "999999"
          : q.answer;
    const body = {
      id: g.id,
      version: g.version,
      quizId,
      questionId: q.id,
      answer,
      activeMs: 25,
    };
    const responses = await Promise.all([
      call("chess/quiz-answer", body),
      call("chess/quiz-answer", body),
    ]);
    assert.ok(responses.every((r) => r.status === 200));
    state = await responses[0].json();
    g = state.game;
    if (i === 0) {
      const retry = await (
        await call("chess/quiz-answer", {
          ...body,
          version: g.version,
          answer: q.answer,
        })
      ).json();
      assert.equal(retry.game.quiz.feedback.correct, false);
    }
    if (i < 2) {
      state = await (
        await call("chess/quiz-next", { id: g.id, version: g.version, quizId })
      ).json();
      g = state.game;
    }
  }
  assert.equal(g.quiz.status, "passed");
  assert.equal(g.quiz.correct, 2);
  assert.ok(g.hint?.from);
  assert.equal(g.quiz.earned, 2);
  const quizWallet = state.stars;
  assert.equal(
    quizWallet,
    beforeStars + 2 + g.quiz.bonuses.reduce((n, b) => n + b.stars, 0),
  );
  state = await (
    await call("chess/quiz-close", { id: g.id, version: g.version, quizId })
  ).json();
  g = state.game;
  assert.equal(
    (await call("chess/undo", { id: g.id, version: g.version })).status,
    404,
  );
  state = await (
    await call("chess/quiz", { id: g.id, version: g.version, action: "undo" })
  ).json();
  g = state.game;
  const undoRaw = (
    await (
      await request("admin/export", undefined, { Cookie: parentCookie })
    ).json()
  ).chess.quizzes.at(-1);
  for (let i = 0; i < 3; i++) {
    const q = undoRaw.questions[i];
    state = await (
      await call("chess/quiz-answer", {
        id: g.id,
        version: g.version,
        quizId: undoRaw.id,
        questionId: q.id,
        answer: q.answer,
      })
    ).json();
    g = state.game;
    if (i < 2) {
      state = await (
        await call("chess/quiz-next", {
          id: g.id,
          version: g.version,
          quizId: undoRaw.id,
        })
      ).json();
      g = state.game;
    }
  }
  assert.equal(g.moves.length, 0);
  assert.equal(g.quiz.status, "passed");
  assert.equal(g.turn, "w");
  state = await (
    await call("chess/quiz-close", {
      id: g.id,
      version: g.version,
      quizId: undoRaw.id,
    })
  ).json();
  g = state.game;
  assert.equal(
    (await call("chess/preferences", { board: "cosmos", pieces: "storybook" }))
      .status,
    200,
  );
  state = await (await call("chess")).json();
  assert.deepEqual(state.preferences, { board: "cosmos", pieces: "storybook" });
  assert.equal(
    (await call("chess", undefined, { "x-lms-learner": "oliver" })).status,
    409,
  );
  const parentReport = await (
    await request("admin", undefined, { Cookie: parentCookie })
  ).json();
  assert.equal(parentReport.chessHistory.games[0].undoCount, 1);
  assert.equal(
    parentReport.chessHistory.quizzes.find((q) => q.id === quizId).attempts[0]
      .correct,
    false,
  );
  assert.equal(
    parentReport.chessHistory.quizzes.find((q) => q.id === quizId).attempts[0]
      .helped,
    true,
  );
  assert.equal((await call("admin/export")).status, 401);
  const calendar = await (await call("calendar")).json();
  const today = calendar.days.find((d) => d.day === calendar.today)?.stars || 0;
  for (const route of ["state", "chess", "dash"]) {
    const counter = await (await call(route)).json();
    assert.equal(counter.todayStars, today, route);
    assert.equal(counter.today, calendar.today, route);
  }
  assert.ok(!JSON.stringify(calendar).includes("expected"));
  assert.ok(!JSON.stringify(calendar).includes("wallMs"));
  const parentExport = await (
    await request("admin/export", undefined, { Cookie: parentCookie })
  ).json();
  assert.equal(parentExport.sessions.length, beforeNative);
  assert.equal(parentExport.chess.games[0].undoEvents.length, 1);
  const selected = await request(
    "learner/select",
    { id: "test1" },
    { Cookie: adminCookie },
  );
  const otherCookie = selected.headers
    .getSetCookie()
    .find((c) => c.startsWith("oliver-admin="))
    .split(";")[0];
  assert.equal(
    (await request("chess/open", { id: gameId }, { Cookie: otherCookie }))
      .status,
    404,
  );
  const otherState = await (
    await request("chess", undefined, { Cookie: otherCookie })
  ).json();
  assert.equal(otherState.game, null);
  assert.deepEqual(otherState.preferences, {
    board: "forest",
    pieces: "classic",
  });
  state = await (
    await call("chess/start", { mode: "lesson", lessonId: "castle-king" })
  ).json();
  g = state.game;
  state = await (
    await call("chess/move", {
      id: g.id,
      version: g.version,
      from: "e1",
      to: "g1",
    })
  ).json();
  assert.equal(state.game.status, "lesson-complete");
  assert.equal(state.game.board.find((p) => p.square === "g1").type, "k");
  assert.equal(state.game.board.find((p) => p.square === "f1").type, "r");
  assert.equal(state.game.earned, 1);
  const saved = await (await call("chess")).json();
  assert.equal(saved.game.status, "lesson-complete");
  assert.equal(
    saved.lessons["castle-king"].firstCompletedAt,
    saved.lessons["castle-king"].lastCompletedAt,
  );
});

test("visual map and people rounds retain server grading, first answers, stars, calendars and learner boundaries", async () => {
  async function login(username, password) {
    const r = await request("login", { username, password });
    assert.equal(r.status, 200);
    return r.headers
      .getSetCookie()
      .find((c) =>
        c.startsWith(username === "admin" ? "oliver-admin=" : "oliver-child="),
      )
      .split(";")[0];
  }
  const adminCookie = await login("admin", "admin1234"),
    studentCookie = await login("test1", "isolated-test1-password");
  const call = (route, body, headers = {}) =>
    request(route, body, { Cookie: studentCookie, ...headers });
  assert.equal(
    (await call("explore/map-continents", undefined, { Cookie: "" })).status,
    401,
  );
  assert.equal((await call("explore/no-such-pack")).status, 404);
  const bank = await (await call("explore/people-world-mix")).json();
  assert.equal(bank.items.length, 500);
  assert.ok(bank.items.filter((p) => p.image).length >= 300);
  const places = await (await call("explore/map-states-locate")).json();
  assert.equal(places.items.length, 50);
  const map = await fetch(base + "/maps/states.json");
  assert.equal(map.status, 200);
  assert.equal((await map.json()).shapes.length, 50);
  const unknown = await fetch(base + "/portraits/not-a-person");
  assert.equal(unknown.status, 200);
  assert.match(await unknown.text(), /Picture unavailable/);
  const before = await (await call("state")).json();
  let view = await (
    await call("session/start", { skill: "map-states-locate" })
  ).json();
  assert.ok(view.question.map);
  assert.ok(!("visualAnswer" in view.question));
  assert.ok(!("answer" in view.question));
  const exported = await (
    await request("admin/export", undefined, { Cookie: adminCookie })
  ).json();
  const raw = exported.learners.test1.sessions.find((s) => s.id === view.id);
  const otherStars = exported.stars;
  for (let i = 0; i < 5; i++) {
    const q = raw.questions[i],
      answer = i === 0 ? String((Number(q.answer) + 1) % 4) : q.answer;
    view = await (
      await call(`session/${raw.id}/answer`, {
        questionId: q.id,
        answer,
        activeMs: 1000,
      })
    ).json();
    assert.equal(view.feedback.map.highlight, q.visualAnswer);
    if (i === 0) {
      const again = await (
        await call(`session/${raw.id}/answer`, {
          questionId: q.id,
          answer: q.answer,
        })
      ).json();
      assert.equal(again.feedback.correct, false);
    }
    view = await (await call(`session/${raw.id}/next`, {})).json();
  }
  assert.equal(view.correct, 4);
  assert.equal(view.stars, 4);
  const after = await (await call("state")).json();
  assert.equal(
    after.stars,
    before.stars + 4 + view.bonuses.reduce((sum, b) => sum + b.stars, 0),
  );
  assert.equal(
    after.stats.find((s) => s.id === raw.skill).lastCompletion.correct,
    4,
  );
  const calendar = await (await call("calendar")).json();
  assert.equal(
    calendar.days.flatMap((d) => d.events).find((e) => e.id === raw.id).correct,
    4,
  );
  assert.equal(
    (await call(`session/${raw.id}`, undefined, { "x-lms-learner": "test2" }))
      .status,
    409,
  );
  const remaining = await (
    await request("admin/export", undefined, { Cookie: adminCookie })
  ).json();
  assert.equal(remaining.stars, otherStars);
  assert.equal(
    remaining.learners.test1.sessions.find((s) => s.id === raw.id).attempts[0]
      .correct,
    false,
  );
  const faces = await (
    await call("session/start", { skill: "people-science-1" })
  ).json();
  assert.ok(faces.question.photo);
  assert.ok(!("answer" in faces.question));
  const who = peopleBank.people.find((p) => p.id === faces.question.photo.id);
  assert.ok(who);
  await call(`session/${faces.id}/leave`, {});
});
