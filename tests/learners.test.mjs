import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "../lib/store.mjs";
import { migrateFamily } from "../lib/migrations.mjs";
import { learnerData, learnerList } from "../lib/learners.mjs";
import { beginSession, submitAnswer, nextQuestion } from "../lib/learning.mjs";
import { learningCalendar } from "../lib/calendar.mjs";

test("schema four adds empty test learners and preserves every Oliver field", () => {
  const d = seed();
  d.version = 3;
  delete d.learners;
  d.stars = 82;
  d.assignments.push({
    id: "quest",
    title: "Read together",
    days: [1],
    stars: 3,
  });
  beginSession(d, "regrouping");
  d.legacy.reading = { saved: "retained" };
  d.storyProgress[1].unlocked = true;
  const original = structuredClone(d);
  migrateFamily(d);
  assert.deepEqual(
    { ...d, version: 3, learners: undefined },
    { ...original, learners: undefined },
  );
  assert.equal(d.version, 7);
  assert.deepEqual(
    learnerList(d).map((x) => x.name),
    ["Oliver", "Test1", "Test2"],
  );
  for (const id of ["test1", "test2"]) {
    assert.equal(d.learners[id].stars, 0);
    assert.deepEqual(d.learners[id].sessions, []);
    assert.deepEqual(d.learners[id].legacy, {});
    assert.ok(!d.learners[id].storyProgress[1].unlocked);
    assert.deepEqual(d.learners[id].assignments, d.assignments);
    assert.notStrictEqual(d.learners[id].assignments, d.assignments);
  }
  const once = structuredClone(d);
  migrateFamily(d);
  assert.deepEqual(d, once);
});

test("learner views write through to their own wallet, profile, quests, rewards, history and calendar", () => {
  const family = seed(),
    oliver = structuredClone(family);
  const one = learnerData(family, "test1"),
    two = learnerData(family, "test2");
  one.stars = 10;
  one.profile = { ...one.profile, age: 8 };
  one.assignments.push({ id: "only-one", stars: 3 });
  one.rewards = [{ id: "only-one", cost: 1 }];
  const view = beginSession(one, "regrouping"),
    s = one.sessions.find((s) => s.id === view.id);
  for (const q of s.questions) {
    submitAnswer(one, s.id, { questionId: q.id, answer: q.answer });
    nextQuestion(one, s.id);
  }
  assert.equal(one.stars, 15);
  assert.equal(two.stars, 0);
  assert.equal(two.sessions.length, 0);
  assert.equal(two.assignments.length, 0);
  assert.ok(!two.rewards.some((r) => r.id === "only-one"));
  assert.equal(family.learners.test1.profile.age, 8);
  const month = one.learningProgram.startDay.slice(0, 7);
  assert.equal(learningCalendar(two, month).days.length, 0);
  assert.equal(
    learningCalendar(one, month).days.filter((d) => d.qualifying).length,
    0,
  );
  assert.deepEqual(
    { ...family, learners: undefined },
    { ...oliver, learners: undefined },
  );
  assert.throws(() => learnerData(family, "__proto__"));
});
