import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "../lib/store.mjs";
import {
  beginSession,
  submitAnswer,
  nextQuestion,
  stats,
} from "../lib/learning.mjs";
import {
  updateStoryProgress,
  createQuestions,
  publicQuestion,
  grade,
  discoveries,
  skills,
} from "../lib/questions.mjs";
import {
  hashPassword,
  verifyPassword,
  signSession,
  readSession,
} from "../lib/security.mjs";
test("three different consecutive 4/5 stories unlock; repeated stories and failures do not", () => {
  const p = seed().storyProgress;
  updateStoryProgress(p, 0, 0, 4);
  updateStoryProgress(p, 0, 1, 5);
  updateStoryProgress(p, 0, 1, 4);
  updateStoryProgress(p, 0, 2, 5);
  assert.equal(p[1].unlocked, false);
  assert.deepEqual(p[0].streak, [1, 1, 2]);
  updateStoryProgress(p, 0, 3, 4);
  assert.equal(p[1].unlocked, true);
  updateStoryProgress(p, 1, 4, 4);
  updateStoryProgress(p, 1, 5, 3);
  assert.deepEqual(p[1].streak, []);
  assert.equal(p[2].unlocked, false);
  updateStoryProgress(p, 4, 18, 4);
  updateStoryProgress(p, 4, 19, 5);
  updateStoryProgress(p, 4, 17, 5);
  assert.equal(p.length, 5);
});
test("answer keys never leave server; wrong first answer cannot be replaced; next is idempotent", () => {
  const d = seed();
  let v = beginSession(d, "regrouping", 1, "practice", 1000);
  assert.ok(!("answer" in v.question));
  assert.ok(!("explanation" in v.question));
  const s = d.sessions[0];
  const q = s.questions[0];
  v = submitAnswer(
    d,
    s.id,
    { questionId: q.id, answer: "999999", activeMs: 3000, focusLosses: 1 },
    5000,
  );
  assert.equal(v.feedback.correct, false);
  submitAnswer(d, s.id, { questionId: q.id, answer: q.answer }, 6000);
  assert.equal(s.attempts.length, 1);
  assert.equal(s.attempts[0].correct, false);
  assert.equal(s.attempts[0].wallMs, 4000);
  nextQuestion(d, s.id, 7000);
  nextQuestion(d, s.id, 8000);
  assert.equal(s.index, 1);
  assert.equal(s.presentedAt, 7000);
  for (let i = 1; i < 5; i++) {
    submitAnswer(
      d,
      s.id,
      {
        questionId: s.questions[i].id,
        answer: s.questions[i].answer,
        activeMs: 4000,
      },
      10000 + i * 5000,
    );
    nextQuestion(d, s.id, 11000 + i * 5000);
  }
  assert.equal(d.stars, 6); // four correct answers plus the once-daily consistency award
  nextQuestion(d, s.id);
  assert.equal(d.stars, 6);
  assert.equal(stats(d).find((x) => x.id === "regrouping").independent, 4);
});
test("hints exclude helped answers; partial sessions retain attempts across resume", () => {
  const d = seed();
  const v = beginSession(d, "phonics");
  const s = d.sessions[0];
  s.hintUsed = true;
  submitAnswer(d, v.id, {
    questionId: s.questions[0].id,
    answer: s.questions[0].answer,
    activeMs: 3000,
  });
  assert.equal(beginSession(d, "phonics").id, v.id);
  assert.equal(beginSession(d, "phonics").feedback.correct, true);
  assert.equal(stats(d).find((x) => x.id === "phonics").independent, 0);
});
test("all six activities create five valid unique questions", () => {
  for (const skill of [
    "fractions",
    "regrouping",
    "phonics",
    "stories",
    "chinese",
    "science",
  ])
    for (let run = 0; run < 20; run++) {
      const { questions } = createQuestions(skill, 1, seed().storyProgress);
      assert.equal(questions.length, 5);
      assert.equal(new Set(questions.map((q) => q.prompt)).size, 5);
      for (const q of questions) {
        assert.ok(q.answer !== undefined);
        assert.ok(q.explanation);
        assert.ok(!("answer" in publicQuestion(q)));
        if (q.options) assert.ok(Number(q.answer) < q.options.length);
      }
    }
});
test("passwords and sessions reject tampering and expiration", () => {
  const h = hashPassword("admin1234");
  assert.equal(verifyPassword("admin1234", h), true);
  assert.equal(verifyPassword("wrong", h), false);
  const token = signSession({ role: "admin", exp: 2000, v: 1 }, "secret");
  assert.equal(readSession(token, "secret", 1000).role, "admin");
  assert.equal(readSession(token + "x", "secret", 1000), null);
  assert.equal(readSession(token, "wrong", 1000), null);
  assert.equal(readSession(token, "secret", 3000), null);
});
test("equivalent fractions and harmless numeric formatting are accepted", () => {
  assert.equal(grade({ answer: "2/4" }, "1 / 2"), true);
  assert.equal(grade({ answer: "1/2" }, "2/0"), false);
  assert.equal(grade({ answer: "1/2" }, "1/3"), false);
  assert.equal(grade({ answer: "12" }, "012"), true);
});

test("every discovery has teachable content, sources, and valid server-private questions", () => {
  assert.equal(discoveries.length, 35);
  assert.equal(new Set(discoveries.map((t) => t.id)).size, discoveries.length);
  for (const topic of discoveries) {
    assert.ok(topic.lesson.length >= 3);
    assert.ok(topic.tryIt);
    assert.ok(topic.sources.every((s) => new URL(s).protocol === "https:"));
    assert.ok(!("questions" in skills[topic.id]));
    assert.ok(topic.questions.length >= 8);
    assert.equal(
      new Set(topic.questions.map((q) => q.prompt)).size,
      topic.questions.length,
    );
    for (const q of topic.questions) {
      assert.equal(
        new Set(q.options).size,
        q.options.length,
        topic.id + ": " + q.prompt,
      );
      assert.ok(q.options[q.answer]);
      assert.ok(q.explanation);
    }
    for (let trail = 1; trail <= (topic.id === "states" ? 5 : 1); trail++) {
      const { questions } = createQuestions(topic.id, trail);
      assert.equal(questions.length, 5);
      assert.equal(new Set(questions.map((q) => q.prompt)).size, 5);
      for (const q of questions) {
        assert.equal(grade(q, q.answer), true);
        const safe = publicQuestion(q);
        assert.ok(!("answer" in safe));
        assert.ok(!("explanation" in safe));
        if (topic.id === "states") {
          assert.ok(
            topic.questions
              .slice((trail - 1) * 10, trail * 10)
              .some((x) => x.prompt === q.prompt),
          );
          assert.ok(
            q.options.every((option) =>
              topic.collection
                .slice((trail - 1) * 10, trail * 10)
                .some((c) => c.detail === option),
            ),
          );
        }
      }
    }
  }
  const stateCards = skills.states.collection;
  assert.equal(stateCards.length, 50);
  assert.equal(new Set(stateCards.map((s) => s.name)).size, 50);
  assert.equal(
    stateCards.find((s) => s.name === "Virginia").detail,
    "Richmond",
  );
});

test("new discovery rounds preserve existing records and prefer fresh questions", () => {
  const d = seed();
  d.stars = 12;
  const old = beginSession(d, "fractions");
  const v = beginSession(d, "ice-age");
  const s = d.sessions.find((x) => x.id === v.id);
  assert.equal(v.subject, "History");
  assert.equal(v.title, "Ice Age camp");
  const q = s.questions[0];
  submitAnswer(d, s.id, {
    questionId: q.id,
    answer: String((Number(q.answer) + 1) % q.options.length),
    activeMs: 1000,
  });
  assert.equal(beginSession(d, "ice-age").feedback.correct, false);
  assert.equal(d.stars, 12);
  assert.equal(beginSession(d, "fractions").id, old.id);
  const recent = s.questions.map((q) => q.prompt);
  const next = createQuestions("ice-age", 1, [], recent).questions;
  assert.equal(next.filter((q) => !recent.includes(q.prompt)).length, 3);
});
