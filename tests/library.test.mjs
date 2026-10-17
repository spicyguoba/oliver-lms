import test from "node:test";
import assert from "node:assert/strict";
import {
  wordBanks,
  vocabularyManifest,
  vocabularyLesson,
} from "../lib/vocabulary.mjs";
import {
  createQuestions,
  skills,
  publicQuestion,
  grade,
} from "../lib/questions.mjs";
import { mathSkills } from "../lib/math.mjs";
import { seed } from "../lib/store.mjs";
import {
  stats,
  beginSession,
  submitAnswer,
  nextQuestion,
} from "../lib/learning.mjs";
import { migrateFamily } from "../lib/migrations.mjs";
import {
  latestCompletion,
  categoryProgress,
  legacyProgress,
} from "../lib/progress.mjs";

test("version four migration is additive and idempotent with existing family progress", () => {
  const old = seed();
  old.version = 1;
  delete old.legacyCompletions;
  old.stars = 91;
  old.settings.childVersion = 7;
  old.legacy.math = { saved: "existing" };
  old.storyProgress[1].unlocked = true;
  beginSession(old, "phonics");
  const original = structuredClone(old);
  assert.strictEqual(migrateFamily(old), old);
  assert.equal(old.version, 7);
  assert.deepEqual(old.legacyCompletions, []);
  assert.deepEqual(
    { ...old, version: 1, legacyCompletions: undefined },
    { ...original, legacyCompletions: undefined },
  );
  const first = structuredClone(old);
  migrateFamily(old);
  assert.deepEqual(old, first);
});
test("completion is the latest finished, non-abandoned round, even at zero; categories count exercises once", () => {
  const sessions = [
    {
      finishedAt: 100,
      questions: [1, 2, 3, 4, 5],
      attempts: [{ correct: true }],
    },
    {
      finishedAt: 200,
      questions: [1, 2, 3, 4, 5],
      attempts: [{ correct: false }],
    },
    { finishedAt: 300, abandoned: true, questions: [], attempts: [] },
    { questions: [], attempts: [] },
  ];
  assert.deepEqual(latestCompletion(sessions), {
    date: 200,
    correct: 0,
    total: 5,
  });
  assert.deepEqual(
    categoryProgress([
      { lastCompletion: latestCompletion(sessions) },
      { lastCompletion: null },
    ]),
    { total: 2, completed: 1, left: 1 },
  );
  assert.equal(latestCompletion(sessions.slice(2)), null);
  const d = seed();
  d.legacyCompletions = [
    { game: "math", date: 200, correct: 4, total: 8 },
    { game: "math", date: 100, correct: 8, total: 8 },
  ];
  assert.deepEqual(legacyProgress(d).math, {
    date: 200,
    correct: 4,
    total: 8,
    source: "legacy-client-reported",
  });
  assert.equal(legacyProgress(d).stories, null);
});
test("word library has 2000 English and 1200 Chinese unique words with complete examples and provenance", () => {
  assert.equal(wordBanks.en.length, 2000);
  assert.equal(wordBanks.zh.length, 1200);
  for (const [lang, bank] of Object.entries(wordBanks)) {
    assert.equal(new Set(bank.map((e) => e.word)).size, bank.length);
    for (const e of bank) {
      assert.ok(e.word && e.meaning && e.source, e.word);
      const text = e.example || e.sentence;
      assert.ok(text && text.length >= (lang === "zh" ? 3 : 6), e.word);
      assert.match(
        text,
        new RegExp(lang === "en" ? "\\b" + e.word + "\\b" : e.word, "i"),
        e.word,
      );
      assert.ok(["Starter", "Growing", "Challenge"].includes(e.band));
      if (lang === "zh")
        assert.ok(e.pinyin && e.translation && e.attribution, e.word);
      assert.doesNotMatch(
        e.meaning + " " + text,
        /\b(fuck|shit|nigger|pornography|suicide)\b|色情|自杀/i,
      );
    }
  }
  assert.equal(vocabularyManifest.packs.length, 320);
  for (const p of vocabularyManifest.packs) {
    const l = vocabularyLesson(p.id);
    assert.equal(l.cards.length, 20);
    assert.ok(
      l.cards.every((e) => e.band === p.band),
      p.id,
    );
    assert.equal(skills[p.id].wordCount, 20);
    assert.ok(!skills[p.id].cards);
  }
});
test("every vocabulary exercise has private keys, unique contextual questions, real blanks, and fresh replay questions", () => {
  for (const p of vocabularyManifest.packs) {
    const { questions } = createQuestions(p.id);
    assert.equal(questions.length, 5, p.id);
    assert.equal(
      new Set(questions.map((q) => q.prompt + q.context)).size,
      5,
      p.id,
    );
    for (const q of questions) {
      assert.equal(q.options.length, 3);
      assert.equal(new Set(q.options).size, 3, p.id);
      assert.ok(q.options[Number(q.answer)]);
      assert.ok(grade(q, q.answer));
      assert.ok(q.explanation);
      assert.ok(!("answer" in publicQuestion(q)));
      assert.ok(!("explanation" in publicQuestion(q)));
      assert.ok(!("explanationParts" in publicQuestion(q)));
      if (p.mode === "usage") {
        assert.match(q.context, /____/);
        assert.ok(!q.vocabWord && !q.pronunciation);
      } else assert.ok(q.vocabWord && q.context);
    }
    const second = createQuestions(
      p.id,
      1,
      [],
      questions.map((q) => q.prompt),
    ).questions;
    assert.ok(
      second.every((q) => !questions.some((x) => x.prompt === q.prompt)),
      p.id,
    );
  }
});
test("all additional math activities generate valid varied problems; fractions and decimal answers are accepted", () => {
  assert.equal(Object.keys(mathSkills).length, 16);
  for (const id of Object.keys(mathSkills))
    for (let i = 0; i < 10; i++) {
      const { questions } = createQuestions(id);
      assert.equal(questions.length, 5);
      assert.equal(new Set(questions.map((q) => q.prompt)).size, 5, id);
      for (const q of questions) {
        assert.ok(q.explanation);
        assert.ok(grade(q, q.answer), id);
        assert.ok(!("answer" in publicQuestion(q)));
      }
    }
  assert.ok(grade({ answer: "0.30" }, ".3"));
  assert.ok(grade({ answer: "4/8" }, "1/2"));
});
test("finished word packs update the latest card score; resume retains old question snapshots", () => {
  const d = seed(),
    v = beginSession(d, "zh-usage-001", 1, "practice", 1000),
    s = d.sessions[0];
  const questions = structuredClone(s.questions);
  assert.equal(beginSession(d, "zh-usage-001").id, v.id);
  assert.deepEqual(s.questions, questions);
  for (let i = 0; i < 5; i++) {
    submitAnswer(
      d,
      s.id,
      {
        questionId: s.questions[i].id,
        answer:
          i === 0
            ? String((Number(s.questions[i].answer) + 1) % 3)
            : s.questions[i].answer,
      },
      2000 + i * 1000,
    );
    nextQuestion(d, s.id, 2100 + i * 1000);
  }
  const progress = stats(d).find((s) => s.id === "zh-usage-001");
  assert.equal(progress.lastCompletion.correct, 4);
  assert.equal(progress.lastCompletion.total, 5);
  assert.equal(progress.lastCompletion.date, 6100);
  assert.equal(d.stars, 4);
});
