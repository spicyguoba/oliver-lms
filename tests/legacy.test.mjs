import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { sanitizeLegacyMap } from "../lib/legacy-save.mjs";
function source(game) {
  const html = fs.readFileSync(
    new URL(`../legacy/${game}.html`, import.meta.url),
    "utf8",
  );
  return [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .join("\n");
}
test("all copied game scripts parse", () => {
  for (const game of ["math", "reading", "stories"])
    new vm.Script(source(game));
});
test("actual copied story game requires distinct consecutive stories and retains stars after failure", () => {
  function element() {
    return {
      style: {},
      classList: { toggle() {}, add() {}, remove() {} },
      children: [],
      append(x) {
        this.children.push(x);
      },
      setAttribute() {},
      textContent: "",
      innerHTML: "",
    };
  }
  const elements = new Map();
  const storage = new Map();
  const context = vm.createContext({
    document: {
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, element());
        return elements.get(id);
      },
      createElement: element,
    },
    localStorage: {
      getItem: (k) => storage.get(k) || null,
      setItem: (k, v) => storage.set(k, v),
    },
    window: { scrollTo() {} },
    console,
    SpeechSynthesisUtterance: function () {},
  });
  vm.runInContext(source("stories"), context);
  const play = (story, score, rank = 0) =>
    vm.runInContext(
      `level=${rank};currentId=${story};correct=${score};finish();`,
      context,
    );
  play(0, 4);
  play(1, 4);
  play(1, 4);
  play(2, 4);
  assert.equal(vm.runInContext("data.levels[1].unlocked", context), false);
  play(3, 5);
  assert.equal(vm.runInContext("data.levels[1].unlocked", context), true);
  const stars = vm.runInContext("data.stars", context);
  play(4, 4, 1);
  play(5, 3, 1);
  assert.equal(vm.runInContext("data.levels[1].streak.length", context), 0);
  assert.ok(vm.runInContext("data.stars", context) >= stars);
});
test("legacy save validation preserves progress and strips stored markup or cross-game keys", () => {
  const clean = sanitizeLegacyMap("reading", {
    "reading-rangers-v1": JSON.stringify({
      stars: 8,
      best: { "0-0": "<img src=x onerror=alert(1)>", "1-0": 4 },
      attempts: { "1-0": 3 },
      unlocked: { "1-1": true },
    }),
    "mathquest-v1": '{"stars":999}',
  });
  const d = JSON.parse(clean["reading-rangers-v1"]);
  assert.equal(d.stars, 8);
  assert.equal(d.best["1-0"], 4);
  assert.equal(d.best["0-0"], 0);
  assert.equal(d.unlocked["1-1"], true);
  assert.ok(!("mathquest-v1" in clean));
  assert.ok(!JSON.stringify(clean).includes("<img"));
  const story = sanitizeLegacyMap("stories", {
    "story-star-adventures-v1": JSON.stringify({
      stars: 9,
      best: { 1: 2 },
      levels: [
        {
          unlocked: true,
          streak: [1, 2],
          history: [1, 2],
          attempts: 3,
          successes: 2,
        },
      ],
    }),
  });
  const s = JSON.parse(story["story-star-adventures-v1"]);
  assert.deepEqual(s.levels[0].streak, [1, 2]);
  assert.equal(s.stars, 9);
});
