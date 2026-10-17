import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "../lib/store.mjs";
import { migrateFamily } from "../lib/migrations.mjs";
import { learnerData } from "../lib/learners.mjs";
import { DASH_LEVELS, dashCourse, replayDash } from "../lib/dash-engine.mjs";
import {
  startDash,
  finishDash,
  answerDash,
  dashState,
  hintDash,
} from "../lib/dash.mjs";
import { learningCalendar } from "../lib/calendar.mjs";
import { pilot } from "./dash-helper.mjs";
import { localDay } from "../lib/dates.mjs";
import { createDashAudio } from "../lib/dash-audio.mjs";

test("original audio schedules distinct scores, respects both mute controls and cleans up", (t) => {
  const notes = [],
    intervals = new Set();
  let closed = false;
  const gain = () => ({
    gain: {
      value: 0,
      setValueAtTime() {},
      linearRampToValueAtTime() {},
      exponentialRampToValueAtTime() {},
      setTargetAtTime() {},
    },
    connect() {},
    disconnect() {},
  });
  class Audio {
    currentTime = 0;
    destination = {};
    resume() {
      return Promise.resolve();
    }
    close() {
      closed = true;
      return Promise.resolve();
    }
    createGain() {
      return gain();
    }
    createOscillator() {
      const node = {
        frequency: { value: 0 },
        connect() {},
        disconnect() {},
        start() {
          notes.push(this.frequency.value);
        },
        stop() {
          this.onended?.();
        },
      };
      return node;
    }
  }
  const oldWindow = globalThis.window;
  globalThis.window = { AudioContext: Audio };
  t.after(() => {
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
  });
  t.mock.method(globalThis, "setInterval", (fn) => {
    intervals.add(fn);
    return fn;
  });
  t.mock.method(globalThis, "clearInterval", (fn) => intervals.delete(fn));
  const audio = createDashAudio();
  audio.play(DASH_LEVELS[0]);
  const first = notes[0];
  assert.ok(notes.length >= 3);
  assert.equal(intervals.size, 1);
  audio.setMusic(false);
  assert.equal(intervals.size, 0);
  const muted = notes.length;
  audio.setSfx(false);
  audio.effect("jump");
  assert.equal(notes.length, muted);
  audio.setSfx(true);
  audio.effect("correct");
  assert.equal(notes.length, muted + 3);
  audio.setMusic(true);
  assert.equal(intervals.size, 1);
  audio.pause();
  assert.equal(intervals.size, 0);
  const next = notes.length;
  audio.play(DASH_LEVELS[19]);
  assert.notEqual(notes[next], first);
  audio.close();
  assert.equal(intervals.size, 0);
  assert.equal(closed, true);
});

test("20 original themes/scores grow faster, longer and denser; all 500 sampled courses are beatable", () => {
  assert.equal(DASH_LEVELS.length, 20);
  assert.equal(new Set(DASH_LEVELS.map((l) => l.title)).size, 20);
  assert.equal(
    new Set(
      DASH_LEVELS.map((l) =>
        JSON.stringify([l.melody, l.root, l.bpm, l.voice]),
      ),
    ).size,
    20,
  );
  for (const level of DASH_LEVELS) {
    if (level.level > 1) {
      const prev = DASH_LEVELS[level.level - 2];
      assert.ok(
        level.speed > prev.speed &&
          level.durationFrames > prev.durationFrames &&
          level.interval < prev.interval,
      );
    }
    for (let seed = 0; seed < 25; seed++) {
      const p = pilot(level.level, seed);
      assert.ok(p.state.won, `level ${level.level} seed ${seed}`);
      assert.ok(replayDash(p.course, p.jumps).won);
      assert.ok(replayDash(p.course, []).dead);
      assert.deepEqual(p.course, dashCourse(level.level, seed));
    }
  }
  assert.equal(DASH_LEVELS.at(-1).reward, 3);
});
test("schema five adds Dash without changing prior records in any learner", () => {
  const d = seed();
  d.version = 4;
  for (const x of [d, ...Object.values(d.learners)]) {
    delete x.dash;
    x.stars = 36;
  }
  const before = structuredClone(d);
  migrateFamily(d);
  const strip = (x) => ({ ...x, dash: undefined });
  assert.equal(d.version, 6);
  assert.deepEqual(
    { ...strip(d), version: 4, learners: undefined },
    { ...strip(before), learners: undefined },
  );
  for (const id of ["test1", "test2"]) {
    assert.deepEqual(strip(d.learners[id]), strip(before.learners[id]));
    assert.equal(d.learners[id].dash.unlocked, 1);
  }
  const after = structuredClone(d);
  migrateFamily(d);
  assert.deepEqual(d, after);
});
test("server requires a real physics clear and elapsed course time before revealing the private question", () => {
  const d = seed(),
    now = Date.now(),
    view = startDash(d, 1, now),
    raw = d.dash.runs[0],
    p = pilot(1, raw.seed);
  assert.equal(view.question, null);
  assert.equal(startDash(d, 1, now).id, view.id);
  assert.throws(() => startDash(d, 2, now), /unlocked/);
  assert.throws(
    () => finishDash(d, view.id, { jumps: p.jumps }, now),
    /Finish the course/,
  );
  const finishAt = now + (p.course.durationFrames / 60) * 1000;
  assert.throws(
    () => finishDash(d, view.id, { jumps: [] }, finishAt),
    /not cleared/,
  );
  assert.throws(
    () => finishDash(d, view.id, { jumps: [1, 1] }, finishAt),
    /invalid/,
  );
  const q = finishDash(d, view.id, { jumps: p.jumps }, finishAt);
  assert.ok(q.question);
  assert.ok(!("answer" in q.question));
  assert.ok(!("explanation" in q.question));
  assert.equal(d.dash.unlocked, 2);
  const snapshot = structuredClone(raw.question);
  finishDash(d, view.id, { jumps: [] }, finishAt + 1000);
  assert.deepEqual(raw.question, snapshot);
  assert.equal(
    startDash(d, 2, finishAt).id,
    view.id,
    "pending question survives map navigation and reload",
  );
});
test("wrong first answers are immutable; replay asks fresh questions and each level pays only once", () => {
  const d = seed(),
    now = Date.now();
  function clear() {
    const v = startDash(d, 1, now),
      r = d.dash.runs.find((r) => r.id === v.id),
      p = pilot(1, r.seed);
    return { r, v: finishDash(d, v.id, { jumps: p.jumps }, now + 20000) };
  }
  let { r, v } = clear();
  let result = answerDash(
    d,
    r.id,
    { questionId: v.question.id, answer: "999999" },
    now + 21000,
  );
  assert.equal(result.feedback.correct, false);
  assert.equal(result.feedback.stars, 0);
  answerDash(
    d,
    r.id,
    { questionId: v.question.id, answer: r.question.answer },
    now + 22000,
  );
  assert.equal(r.attempt.correct, false);
  const firstPrompt = r.question.prompt;
  ({ r, v } = clear());
  assert.notEqual(r.question.prompt, firstPrompt);
  hintDash(d, r.id);
  result = answerDash(
    d,
    r.id,
    { questionId: v.question.id, answer: r.question.answer },
    now + 23000,
  );
  assert.equal(result.feedback.stars, 1);
  assert.ok(r.attempt.helped);
  assert.equal(d.stars, 1); // A single Dash star does not meet the 21-star streak goal.
  answerDash(d, r.id, {}, now + 24000);
  assert.equal(d.stars, 1);
  ({ r, v } = clear());
  answerDash(
    d,
    r.id,
    { questionId: v.question.id, answer: r.question.answer },
    now + 25000,
  );
  assert.equal(r.earned, 0);
  assert.equal(d.stars, 1);
  const child = learningCalendar(d, localDay(now).slice(0, 7), now),
    parent = learningCalendar(d, localDay(now).slice(0, 7), now, true);
  assert.equal(child.days[0].stars, 1);
  assert.ok(!child.days[0].qualifying);
  assert.ok(
    parent.days[0].events.some((e) => e.mode === "dash study question"),
  );
});
test("all twenty study questions grade, unlock in order and award exactly 22 Dash stars per learner", () => {
  const family = seed(),
    d = learnerData(family, "test1");
  let now = Date.now();
  for (let level = 1; level <= 20; level++) {
    const view = startDash(d, level, now),
      r = d.dash.runs.at(-1),
      p = pilot(level, r.seed);
    now += 40000;
    const question = finishDash(d, view.id, { jumps: p.jumps }, now).question;
    assert.ok(question);
    const result = answerDash(
      d,
      view.id,
      { questionId: question.id, answer: r.question.answer, activeMs: 1000 },
      now + 1000,
    );
    assert.equal(result.feedback.stars, level === 20 ? 3 : 1);
    now += 2000;
  }
  assert.equal(d.dash.unlocked, 20);
  assert.equal(
    d.dash.runs.reduce((n, r) => n + r.earned, 0),
    22,
  );
  assert.equal(d.stars, 24);
  assert.equal(family.stars, 0);
  assert.equal(family.learners.test2.stars, 0);
  assert.equal(dashState(d).pending, null);
  assert.equal(family.sessions.length, 0);
});
