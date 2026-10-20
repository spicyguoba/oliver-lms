import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  atlas,
  peopleBank,
  explorerSkills,
  explorerLesson,
  lifeDates,
} from "../lib/explorers.mjs";
import { createQuestions, publicQuestion, grade } from "../lib/questions.mjs";
import { seed } from "../lib/store.mjs";
import {
  beginSession,
  submitAnswer,
  nextQuestion,
  stats,
} from "../lib/learning.mjs";
import { dailyStarSummary, learningCalendar } from "../lib/calendar.mjs";
import { learnerData } from "../lib/learners.mjs";
import { portraitResponse } from "../lib/portraits.mjs";
test("the atlas contains seven continents, all fifty states and 94 distinct selected countries with complete cards", () => {
  assert.equal(atlas.continents.length, 7);
  assert.equal(atlas.states.length, 50);
  assert.equal(atlas.countries.length, 94);
  for (const list of [atlas.continents, atlas.states, atlas.countries]) {
    assert.equal(new Set(list.map((p) => p.id)).size, list.length);
    assert.equal(new Set(list.map((p) => p.name)).size, list.length);
    assert.ok(list.every((p) => p.fact && p.name && p.id));
  }
  assert.ok(atlas.states.every((p) => p.capital));
  assert.equal(
    atlas.states.find((p) => p.name === "Virginia").capital,
    "Richmond",
  );
  assert.equal(
    atlas.countries.find((p) => p.name === "Brazil").capital,
    "Brasília",
  );
  for (const [id, meta] of Object.entries(explorerSkills).filter(
    ([, m]) => m.subject === "Geography",
  )) {
    const lesson = explorerLesson(id),
      map = JSON.parse(fs.readFileSync(`public/maps/${meta.map}.json`));
    for (const p of lesson.items) {
      const shape = map.shapes.find((s) => s.id === p.id);
      assert.ok(shape?.d, p.name + " in " + id);
      assert.ok(shape.point.every(Number.isFinite), p.name);
    }
    assert.ok(map.shapes.every((s) => s.d && !s.d.includes("NaN")));
  }
});
test("500 individual people have contributions, life-date sources and safe licensed image metadata when available", () => {
  assert.equal(peopleBank.people.length, 500);
  assert.equal(new Set(peopleBank.people.map((p) => p.id)).size, 500);
  assert.ok(peopleBank.people.filter((p) => p.image).length >= 300);
  const packed = new Set();
  for (const id of Object.keys(explorerSkills).filter(
    (id) => id.startsWith("people-") && id !== "people-world-mix",
  )) {
    const lesson = explorerLesson(id);
    assert.equal(lesson.items.length, 10);
    for (const p of lesson.items) {
      packed.add(p.id);
      assert.ok(p.fact.length > 10);
      assert.match(p.source, /wikipedia\.org/);
      assert.match(p.dateSource, /wikidata\.org/);
    }
  }
  assert.equal(packed.size, 500);
  for (const p of peopleBank.people) {
    assert.ok(p.born === null || Number.isInteger(p.born));
    assert.ok(p.died === null || p.born === null || p.died >= p.born, p.name);
    if (p.image) {
      assert.ok(
        ["upload.wikimedia.org", "thumb.wikimedia.org"].includes(
          new URL(p.image.url).hostname,
        ),
      );
      assert.ok(p.image.author && p.image.license && p.image.source);
    }
  }
  assert.match(
    lifeDates({ born: -551, died: -479, approximate: true }),
    /about 551 BCE/,
  );
  assert.equal(lifeDates({ born: null, died: null }), "Dates uncertain");
});
test("all map and people games generate five private, valid, distinct targets and rotate the ten-card packs", () => {
  for (const [id, meta] of Object.entries(explorerSkills)) {
    const a = createQuestions(id).questions,
      b = createQuestions(
        id,
        1,
        [],
        a.map((q) => q.prompt),
      ).questions;
    assert.equal(a.length, 5, id);
    assert.equal(new Set(a.map((q) => q.prompt)).size, 5, id);
    for (const q of [...a, ...b]) {
      assert.equal(q.options.length, 4, id);
      assert.equal(new Set(q.options).size, 4, id);
      assert.ok(grade(q, q.answer), id);
      const pub = publicQuestion(q);
      for (const key of ["answer", "explanation", "visualAnswer"])
        assert.ok(!(key in pub), id);
      if (q.map) {
        const map = JSON.parse(
          fs.readFileSync(`public/maps/${q.map.key}.json`),
        );
        assert.ok(map.shapes.some((s) => s.id === q.visualAnswer));
        if (q.map.choices.length)
          assert.equal(q.map.choices[Number(q.answer)], q.visualAnswer);
      }
    }
    if (meta.collectionCount >= 10) {
      const target = (q) => q.visualAnswer || q.photo?.id || q.targetName;
      assert.ok(
        b.every((q) => !a.some((old) => target(old) === target(q))),
        id,
      );
    }
  }
});
test("visual rounds save first answers, show the correct shape only after answering, and earn ordinary calendar stars in the right learner", () => {
  const root = seed(),
    d = learnerData(root, "test2"),
    now = Date.parse("2026-10-19T15:00:00Z");
  let s = beginSession(d, "map-states-locate", 1, "practice", now),
    raw = d.sessions.at(-1),
    time = now;
  const snapshot = structuredClone(raw.questions);
  for (let i = 0; i < 5; i++) {
    const q = raw.questions[i],
      answer = i === 0 ? String((Number(q.answer) + 1) % 4) : q.answer;
    s = submitAnswer(
      d,
      s.id,
      { questionId: q.id, answer, activeMs: 1000 },
      (time += 2000),
    );
    assert.equal(s.feedback.map.highlight, q.visualAnswer);
    const saved = structuredClone(raw.attempts.at(-1));
    submitAnswer(d, s.id, { questionId: q.id, answer: q.answer }, time + 1);
    assert.deepEqual(raw.attempts.at(-1), saved);
    s = nextQuestion(d, s.id, (time += 1000));
  }
  assert.equal(s.stars, 4);
  assert.equal(d.stars, 4);
  assert.equal(root.stars, 0);
  assert.deepEqual(raw.questions, snapshot);
  assert.equal(dailyStarSummary(d, time).todayStars, 4);
  assert.equal(
    learningCalendar(d, "2026-10", time).days[0].events[0].correct,
    4,
  );
  assert.equal(
    stats(d).find((x) => x.id === "map-states-locate").lastCompletion.correct,
    4,
  );
  const count = d.stars;
  nextQuestion(d, s.id, time);
  assert.equal(d.stars, count);
});
test("portrait fetching uses only fixed checked URLs and safely falls back on failures, HTML or unknown IDs", async () => {
  const person = peopleBank.people.find((p) => p.image);
  let calls = 0;
  const fetcher = async (url) => {
    calls++;
    assert.equal(url, person.image.url);
    return new Response(new Uint8Array([255, 216, 255]), {
      headers: { "content-type": "image/jpeg" },
    });
  };
  const r = await portraitResponse(person.id, fetcher);
  assert.equal(r.headers.get("content-type"), "image/jpeg");
  assert.match(r.headers.get("cache-control"), /s-maxage/);
  const unknown = await portraitResponse("https://localhost/private", fetcher);
  assert.match(await unknown.text(), /Picture unavailable/);
  assert.equal(calls, 1);
  const bad = await portraitResponse(
    person.id,
    async () =>
      new Response("<script>bad</script>", {
        headers: { "content-type": "text/html" },
      }),
  );
  assert.match(await bad.text(), /Picture unavailable/);
  const fail = await portraitResponse(person.id, async () => {
    throw Error("offline");
  });
  assert.match(await fail.text(), /Picture unavailable/);
});
