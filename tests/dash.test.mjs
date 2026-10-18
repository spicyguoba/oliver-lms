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
  assert.equal(d.version, 8);
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
    () => finishDash(d, view.id, { inputs: p.inputs }, now),
    /Finish the course/,
  );
  const finishAt = now + (p.course.durationFrames / 60) * 1000;
  assert.throws(
    () => finishDash(d, view.id, { inputs: [] }, finishAt),
    /not cleared/,
  );
  assert.throws(
    () =>
      finishDash(
        d,
        view.id,
        {
          inputs: [
            { frame: 1, down: true },
            { frame: 1, down: false },
          ],
        },
        finishAt,
      ),
    /invalid/,
  );
  const q = finishDash(d, view.id, { inputs: p.inputs }, finishAt);
  assert.ok(q.question);
  assert.ok(!("answer" in q.question));
  assert.ok(!("explanation" in q.question));
  assert.equal(d.dash.unlocked, 2);
  const snapshot = structuredClone(raw.question);
  finishDash(d, view.id, { inputs: [] }, finishAt + 1000);
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
    return { r, v: finishDash(d, v.id, { inputs: p.inputs }, now + 20000) };
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
    now += (p.state.frame / 60) * 1000 + 1000;
    const question = finishDash(d, view.id, { inputs: p.inputs }, now).question;
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
import { initialDash, stepDash, validDashInputs } from "../lib/dash-engine.mjs";
import { legacyPilot } from "./dash-helper.mjs";
const arena = (extra = {}) => ({
  ...dashCourse(1, 1),
  entities: [],
  obstacles: [],
  finishX: 100000,
  ...extra,
});
test("cube uses edge taps, buffers five steps, and never auto-hops on a held key", () => {
  const c = arena();
  let s = initialDash();
  for (let i = 0; i < 120; i++) s = stepDash(s, true, c);
  assert.equal(s.y, 0);
  assert.equal(s.vy, 0);
  s = stepDash(s, false, c);
  s = stepDash(s, true, c);
  assert.ok(s.vy > 0);
  s = { ...initialDash(), y: 4, vy: -100 };
  s = stepDash(s, true, c);
  assert.equal(s.y, 4 - 133.33333333333334 / 60);
  for (let i = 0; i < 4; i++) s = stepDash(s, false, c);
  assert.ok(s.y > 0 && s.vy > 0, "early press executes on landing");
  s = { ...initialDash(), y: 80, vy: -100 };
  s = stepDash(s, true, c);
  for (let i = 0; i < 40; i++) s = stepDash(s, false, c);
  assert.equal(s.y, 0, "expired input cannot jump later");
});
test("portals sweep at speed without stopping; dual clone collisions kill either side", () => {
  const c = arena({
    entities: [
      { id: 0, kind: "gravity", x: 32, value: 1 },
      { id: 1, kind: "dual", x: 32, value: true },
    ],
  });
  let s = stepDash({ ...initialDash(), speed: 4 }, false, c);
  assert.equal(s.gravity, 1);
  assert.equal(s.dual, true);
  assert.ok(s.x > 0);
  s = stepDash(s, false, c);
  assert.equal(s.gravity, 1, "portal activates once");
  const wall = {
    x: 0,
    width: 80,
    y: 250,
    height: 50,
    kind: "block",
    side: "ceiling",
  };
  assert.equal(
    stepDash(initialDash(), false, arena({ obstacles: [wall] })).dead,
    false,
  );
  assert.equal(
    stepDash(
      { ...initialDash(), dual: true },
      false,
      arena({ obstacles: [wall] }),
    ).dead,
    true,
  );
});
test("orbs consume buffered taps once; pink is smaller, blue flips; pads are passive", () => {
  const impulse = (kind) =>
    stepDash(
      { ...initialDash(), y: 100 },
      true,
      arena({ entities: [{ id: 0, kind, x: 15, y: 115, radius: 34 }] }),
    );
  const yellow = impulse("yellow"),
    pink = impulse("pink"),
    blue = impulse("blue");
  assert.ok(yellow.vy > pink.vy && pink.vy > 0);
  assert.equal(blue.gravity, 1);
  assert.deepEqual(yellow.used, [0]);
  const c = arena({
    entities: [{ id: 0, kind: "yellow", x: 45, y: 115, radius: 5 }],
  });
  let s = stepDash({ ...initialDash(), y: 100 }, true, c);
  for (let i = 0; i < 4; i++) s = stepDash(s, false, c);
  assert.ok(s.used.includes(0), "press before entering the ring is buffered");
  const pad = stepDash(
    initialDash(),
    false,
    arena({ entities: [{ id: 0, kind: "pad", x: 20, y: 0 }] }),
  );
  assert.ok(pad.vy > 700);
});
test("ship thrust follows gravity; wave uses diagonals and safely slides on flat walls", () => {
  const c = arena();
  const ship = { ...initialDash(), mode: "ship", y: 130 };
  assert.ok(stepDash(ship, true, c).vy > 0);
  assert.ok(stepDash(ship, false, c).vy < 0);
  assert.ok(stepDash({ ...ship, gravity: 1 }, true, c).vy < 0);
  const wave = { ...initialDash(), mode: "wave", y: 130 };
  assert.equal(stepDash(wave, true, c).vy, c.speed);
  assert.equal(stepDash(wave, false, c).vy, -c.speed);
  let s = { ...wave, y: 0 };
  for (let i = 0; i < 60; i++) s = stepDash(s, false, c);
  assert.equal(s.y, 0);
  assert.equal(s.dead, false);
  s = stepDash({ ...wave, y: 270 }, true, c);
  assert.equal(s.y, 270);
  assert.equal(s.dead, false);
  const hazard = { x: 15, width: 80, y: 120, height: 50, kind: "block" };
  assert.ok(stepDash(wave, true, arena({ obstacles: [hazard] })).dead);
});
test("inner hazard bounds allow a visual near miss while direct hits still fail", () => {
  const c = arena({
    obstacles: [{ x: 20, width: 100, y: 0, height: 80, kind: "block" }],
  });
  assert.equal(
    stepDash({ ...initialDash(), x: 30, y: 68 }, false, c).dead,
    false,
  );
  assert.equal(
    stepDash({ ...initialDash(), x: 30, y: 20 }, false, c).dead,
    true,
  );
});
test("new input traces are bounded, alternate and reject malformed or duplicate events", () => {
  const c = dashCourse(20, 1);
  assert.ok(
    validDashInputs(c, [
      { frame: 0, down: true },
      { frame: 10, down: false },
    ]),
  );
  for (const inputs of [
    null,
    [1],
    [{ frame: 0, down: false }],
    [
      { frame: 1, down: true },
      { frame: 2, down: true },
    ],
    [
      { frame: 1, down: true },
      { frame: 1, down: false },
    ],
    [{ frame: c.durationFrames + 180, down: true }],
    Array(c.durationFrames + 1).fill({ frame: 0, down: true }),
  ])
    assert.equal(validDashInputs(c, inputs), false);
});
test("all legacy seeds replay unchanged; saved v1 clears and pending questions stay compatible", () => {
  for (let l = 1; l <= 20; l++)
    for (let seed = 0; seed < 25; seed++) {
      const p = legacyPilot(l, seed);
      assert.ok(replayDash(dashCourse(l, seed, 1), p.jumps).won);
    }
  const d = seed(),
    now = Date.now(),
    p = legacyPilot(1, 17);
  d.dash.runs.push({
    id: "legacy",
    level: 1,
    seed: 17,
    engineVersion: 1,
    startedAt: now - 20000,
    status: "running",
  });
  const q = finishDash(d, "legacy", { jumps: p.jumps }, now);
  assert.equal(q.engineVersion, 1);
  assert.ok(q.question);
  const snapshot = structuredClone(d.dash.runs[0]);
  assert.equal(startDash(d, 1, now).id, "legacy");
  assert.deepEqual(d.dash.runs[0], snapshot);
});
test("later courses require steering and discrete timing; holding throughout cannot win", () => {
  for (const l of [6, 8, 13, 16, 19, 20]) {
    const c = dashCourse(l, 123);
    assert.equal(replayDash(c, [{ frame: 0, down: true }]).won, false);
    assert.equal(replayDash(c, []).won, false);
  }
  const final = dashCourse(20, 9);
  assert.ok(final.entities.some((e) => e.kind === "speed" && e.value === 4));
  assert.ok(final.sections.length > dashCourse(1, 9).sections.length);
  const gaps = (c) =>
    c.obstacles
      .filter((o) => o.kind === "block" && o.side === "floor")
      .map(
        (o) =>
          c.obstacles.find((x) => x.x === o.x && x.side === "ceiling").y -
          o.height,
      );
  assert.ok(Math.min(...gaps(final)) < Math.min(...gaps(dashCourse(7, 9))));
});
