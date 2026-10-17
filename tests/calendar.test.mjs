import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "../lib/store.mjs";
import { migrateFamily } from "../lib/migrations.mjs";
import { localDay, shiftDay, dayDistance } from "../lib/dates.mjs";
import {
  learningCalendar,
  awardConsistency,
  streaks,
} from "../lib/calendar.mjs";
import { dailyPlan, scheduleDay, PROGRAM_DAYS } from "../lib/planner.mjs";
import {
  skills,
  createQuestions,
  publicQuestion,
  grade,
} from "../lib/questions.mjs";
import { beginSession, submitAnswer, nextQuestion } from "../lib/learning.mjs";
const noon = (day) => Date.parse(day + "T16:00:00Z");
function finish(data, skill, day, difficulty = 1, correct = true) {
  let now = noon(day),
    view = beginSession(data, skill, difficulty, "practice", now);
  const s = data.sessions.find((s) => s.id === view.id);
  for (const q of s.questions) {
    submitAnswer(
      data,
      s.id,
      {
        questionId: q.id,
        answer: correct
          ? q.answer
          : q.options
            ? String((Number(q.answer) + 1) % q.options.length)
            : "999999",
        activeMs: 1000,
      },
      (now += 1000),
    );
    view = nextQuestion(data, s.id, (now += 1000));
  }
  return view;
}
test("migration retains wallets, first answers, saved question snapshots, auth, and does not back-award", () => {
  const d = seed();
  d.version = 2;
  d.stars = 73;
  delete d.dailyPlans;
  delete d.learningProgram;
  delete d.consistencyAwards;
  beginSession(d, "regrouping", 1, "practice", noon("2026-10-16"));
  const before = structuredClone(d);
  migrateFamily(d, noon("2026-10-17"));
  assert.equal(d.version, 6);
  assert.equal(d.learningProgram.startDay, "2026-10-17");
  assert.deepEqual(
    {
      ...d,
      version: 2,
      dailyPlans: undefined,
      learningProgram: undefined,
      consistencyAwards: undefined,
    },
    {
      ...before,
      dailyPlans: undefined,
      learningProgram: undefined,
      consistencyAwards: undefined,
    },
  );
  const after = structuredClone(d);
  migrateFamily(d);
  assert.deepEqual(d, after);
  learningCalendar(d, "2026-10", noon("2026-10-17"));
  assert.equal(d.stars, 73);
});
test("streaks follow local civil dates through DST, keep yesterday alive, and reset after a gap", () => {
  const d = seed();
  for (const day of ["2026-10-31", "2026-11-01", "2026-11-02"])
    for (let i = 0; i < 5; i++) finish(d, "regrouping", day);
  assert.equal(streaks(d, noon("2026-11-03")).current, 3);
  assert.equal(streaks(d, noon("2026-11-04")).current, 0);
  assert.equal(streaks(d, noon("2026-11-04")).best, 3);
  assert.equal(shiftDay("2028-02-28", 1), "2028-02-29");
  assert.equal(dayDistance("2026-10-31", "2026-11-02"), 2);
  assert.equal(localDay(Date.parse("2026-11-01T03:59:00Z")), "2026-10-31");
  assert.equal(localDay(Date.parse("2026-11-01T04:00:00Z")), "2026-11-01");
});
test("zero-score practice stays visible; 21-star days pay once and seven days pays a milestone", () => {
  const d = seed();
  finish(d, "regrouping", "2026-10-16", 1, false);
  assert.equal(d.stars, 0);
  assert.equal(streaks(d, noon("2026-10-16")).current, 0);
  for (let i = 0; i < 7; i++) {
    const day = shiftDay("2026-10-17", i);
    let v;
    for (let j = 0; j < 5; j++) v = finish(d, "regrouping", day);
    assert.equal(v.correct, 5);
    nextQuestion(d, v.id, noon(day) + 20000);
    awardConsistency(d, noon(day) + 30000);
  }
  assert.equal(d.stars, 7 * 25 + 7 * 2 + 5);
  assert.equal(d.consistencyAwards.length, 8);
  assert.equal(streaks(d, noon("2026-10-23")).current, 7);
  d.stars -= 3;
  const c = learningCalendar(d, "2026-10", noon("2026-10-23"));
  assert.equal(
    c.days.reduce((n, d) => n + d.stars, 0),
    194,
  );
  assert.equal(d.stars, 191);
});
test("daily plans stay fixed, unfinished games resume, all-five bonus is atomic and abandoned games don't count", () => {
  const d = seed(),
    now = noon("2026-10-17");
  d.learningProgram.startDay = "2026-10-17";
  const plan = dailyPlan(d, now),
    saved = structuredClone(d.dailyPlans);
  for (const slot of plan.slots)
    finish(d, slot.skill, plan.day, slot.difficulty, false);
  assert.deepEqual(d.dailyPlans, saved);
  assert.equal(dailyPlan(d, now).slots.filter((s) => s.completed).length, 5);
  assert.equal(d.stars, 5); // Daily-five completion bonus stays separate from the 21-star streak goal.
  awardConsistency(d, now);
  assert.equal(d.stars, 5);
  const v = beginSession(d, "phonics", 1, "practice", now);
  assert.equal(beginSession(d, "phonics", 1, "practice", now).id, v.id);
  d.sessions.find((s) => s.id === v.id).abandoned = true;
  d.sessions.find((s) => s.id === v.id).finishedAt = now;
  assert.equal(
    learningCalendar(d, "2026-10", now).days[0].events.filter(
      (e) => e.type === "game",
    ).length,
    5,
  );
});
test("calendar keeps legacy scores and pending/older quests separate, parent-only attempts never reach child view", () => {
  const d = seed(),
    now = noon("2026-10-17");
  finish(d, "regrouping", "2026-10-17");
  d.legacyCompletions.push({
    id: "old",
    game: "reading",
    correct: 4,
    total: 5,
    date: noon("2026-10-16"),
  });
  d.completions.push(
    {
      id: "pending",
      assignmentId: "x",
      day: "2026-10-15",
      at: now,
      status: "pending",
    },
    {
      id: "oldquest",
      assignmentId: "x",
      day: "2026-10-14",
      at: now,
      status: "approved",
    },
  );
  const child = learningCalendar(d, "2026-10", now),
    parent = learningCalendar(d, "2026-10", now, true);
  assert.ok(!child.days.find((d) => d.day === "2026-10-16").qualifying);
  assert.ok(!child.days.find((d) => d.day === "2026-10-15").qualifying);
  assert.ok(child.days.find((d) => d.day === "2026-10-14").unknownQuestStars);
  assert.ok(!("attempts" in child.days.at(-1).events[0]));
  assert.equal(parent.days.at(-1).events[0].attempts.length, 5);
});
test("word rotations cover twenty targets in four rounds; repeated procedural math sets change", () => {
  for (const id of [
    "en-words-001",
    "en-usage-100",
    "zh-words-001",
    "zh-usage-060",
  ]) {
    let history = [];
    for (let i = 0; i < 4; i++) {
      const q = createQuestions(id, 1, [], history).questions;
      assert.ok(
        q.every((q) => !history.includes(q.prompt)),
        id,
      );
      history.push(...q.map((q) => q.prompt));
    }
    assert.equal(new Set(history).size, 20);
  }
  for (const id of Object.keys(skills).filter(
    (id) => skills[id].subject === "Math",
  )) {
    const a = createQuestions(id, 2).questions,
      b = createQuestions(
        id,
        2,
        [],
        a.map((q) => q.prompt),
      ).questions;
    assert.ok(
      b.every((q) => !a.some((x) => x.prompt === q.prompt)),
      id,
    );
    assert.ok(b.every((q) => grade(q, q.answer)));
  }
});
test(
  "400-day bank can serve 2,000 valid rounds and 10,000 questions without exposing answer keys",
  { timeout: 180000 },
  () => {
    const history = new Map(),
      subjects = new Set(),
      exercised = new Set();
    let count = 0;
    assert.ok(PROGRAM_DAYS > 365);
    for (let day = 0; day < PROGRAM_DAYS; day++) {
      const ids = scheduleDay(day);
      assert.equal(ids.length, 5);
      assert.equal(new Set(ids).size, 5);
      for (const id of ids) {
        assert.ok(skills[id]);
        subjects.add(skills[id].subject);
        exercised.add(id);
        const recent = history.get(id) || [];
        const { questions } = createQuestions(
          id,
          day >= 120 ? 2 : 1,
          [{ unlocked: true, streak: [] }],
          recent,
        );
        assert.equal(questions.length, 5, id);
        if (recent.length && id !== "stories")
          assert.notDeepEqual(
            new Set(questions.map((q) => q.prompt)),
            new Set(recent.slice(-5)),
            id,
          );
        for (const q of questions) {
          assert.ok(grade(q, q.answer), id);
          assert.ok(!("answer" in publicQuestion(q)));
          count++;
        }
        history.set(id, [...recent, ...questions.map((q) => q.prompt)]);
      }
    }
    assert.equal(count, 10000);
    assert.equal(subjects.size, 6);
    assert.ok(exercised.size >= 300, `${exercised.size} activities`);
  },
);

test("a round spanning midnight records actual practice days and awards only on finish day", () => {
  const d = seed(),
    start = noon("2026-10-16");
  const v = beginSession(d, "regrouping", 1, "practice", start),
    s = d.sessions.find((s) => s.id === v.id);
  for (let i = 0; i < 5; i++) {
    const now = noon(i === 0 ? "2026-10-16" : "2026-10-17") + i * 1000;
    submitAnswer(
      d,
      s.id,
      { questionId: s.questions[i].id, answer: s.questions[i].answer },
      now,
    );
    nextQuestion(d, s.id, now + 100);
  }
  const c = learningCalendar(d, "2026-10", noon("2026-10-17"));
  const before = c.days.find((d) => d.day === "2026-10-16"),
    after = c.days.find((d) => d.day === "2026-10-17");
  assert.equal(before.stars, 0);
  assert.equal(before.qualifying, false);
  assert.equal(before.events[0].type, "practice");
  assert.equal(before.events[0].total, 1);
  assert.equal(after.stars, 5);
  assert.equal(after.qualifying, false);
});

test("streak requires exactly 21 earned study stars; bonuses and spending cannot change the goal", () => {
  const d = seed(),
    day = "2026-10-17",
    now = noon(day);
  for (let i = 0; i < 4; i++) finish(d, "regrouping", day);
  assert.equal(streaks(d, now).todayStars, 20);
  assert.equal(streaks(d, now).todayComplete, false);
  d.consistencyAwards.push({
    day,
    kind: "five",
    stars: 5,
    label: "Today's five finished",
    at: now,
  });
  d.stars += 5;
  const below = learningCalendar(d, "2026-10", now).days[0];
  assert.equal(below.stars, 25);
  assert.equal(below.studyStars, 20);
  assert.equal(below.qualifying, false);
  d.completions.push({
    id: "one-star",
    day,
    status: "approved",
    earned: 1,
    at: now,
  });
  d.stars++;
  awardConsistency(d, now);
  const achieved = streaks(d, now);
  assert.equal(achieved.goalStars, 21);
  assert.equal(achieved.todayStars, 21);
  assert.equal(achieved.todayComplete, true);
  assert.equal(
    d.consistencyAwards.filter((a) => a.kind === "practice").length,
    1,
  );
  d.stars -= 15;
  awardConsistency(d, now + 1000);
  assert.equal(streaks(d, now).todayComplete, true);
  assert.equal(d.stars, 13);
  const calendar = learningCalendar(d, "2026-10", now);
  assert.equal(calendar.days[0].stars, 28);
  assert.equal(calendar.days[0].studyStars, 21);
  assert.equal(calendar.days[0].qualifying, true);
});

test("daily math stretch requires practice evidence and a saved day's difficulty never shifts", () => {
  const d = seed();
  d.learningProgram.startDay = "2026-06-01";
  const early = dailyPlan(d, noon("2026-10-16"));
  assert.equal(early.slots[0].difficulty, 1);
  for (let i = 0; i < 4; i++) finish(d, "regrouping", "2026-10-16");
  assert.equal(dailyPlan(d, noon("2026-10-16")).slots[0].difficulty, 1);
  assert.equal(dailyPlan(d, noon("2026-10-17")).slots[0].difficulty, 2);
  const fresh = seed();
  fresh.learningProgram.startDay = "2026-06-01";
  assert.equal(dailyPlan(fresh, noon("2026-10-17")).slots[0].difficulty, 1);
});

test("a failed story replay rotates to another passage while preserving the earned rank", () => {
  const d = seed();
  const first = finish(d, "stories", "2026-10-16", 1, false);
  const old = d.sessions.find((s) => s.id === first.id);
  const second = beginSession(d, "stories", 1, "practice", noon("2026-10-17"));
  const next = d.sessions.find((s) => s.id === second.id);
  assert.notEqual(next.storyId, old.storyId);
  assert.equal(next.rank, old.rank);
  assert.deepEqual(d.storyProgress[0].streak, []);
});
