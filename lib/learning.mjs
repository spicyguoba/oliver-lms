import { randomUUID } from "node:crypto";
import {
  createQuestions,
  publicQuestion,
  grade,
  updateStoryProgress,
  skills,
} from "./questions.mjs";
export function localDay(t = Date.now(), timezone = "America/New_York") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(t));
}
export function stats(data) {
  return Object.entries(skills).map(([id, meta]) => {
    const all = data.sessions
      .filter((s) => s.skill === id)
      .flatMap((s) => s.attempts.map((a) => ({ ...a, mode: s.mode })));
    const independent = all.filter(
      (a) =>
        !a.helped &&
        a.focusLosses === 0 &&
        a.wallMs < 600000 &&
        a.activeMs >= 0,
    );
    const observed = independent.filter((a) => a.mode === "observed");
    const times = independent
      .filter((a) => a.correct)
      .map((a) => a.wallMs)
      .sort((a, b) => a - b);
    return {
      id,
      ...meta,
      total: all.length,
      correct: all.filter((a) => a.correct).length,
      independent: independent.length,
      independentCorrect: independent.filter((a) => a.correct).length,
      observed: observed.length,
      medianSeconds: times.length
        ? Math.round(times[Math.floor(times.length / 2)] / 100) / 10
        : null,
      accuracy: independent.length
        ? Math.round(
            (100 * independent.filter((a) => a.correct).length) /
              independent.length,
          )
        : null,
    };
  });
}
export function recommendations(data) {
  const s = stats(data);
  return [...s]
    .sort((a, b) => {
      const score = (x) =>
        x.total === 0
          ? ["phonics", "fractions"].includes(x.id)
            ? -20
            : 0
          : (x.accuracy ?? 50) - 30;
      return score(a) - score(b);
    })
    .slice(0, 3)
    .map((x) => ({
      ...x,
      reason:
        x.total === 0
          ? "Start with a short discovery round"
          : `${x.independent} independent answers · ${x.accuracy ?? "—"}% correct · revisit with fresh practice`,
    }));
}
export function beginSession(
  data,
  skill,
  difficulty = 1,
  mode = "practice",
  now = Date.now(),
) {
  if (!skills[skill]) throw new Error("Unknown skill");
  const current = data.sessions.find(
    (s) =>
      !s.finishedAt &&
      s.skill === skill &&
      s.mode === mode &&
      s.difficulty === difficulty,
  );
  if (current) return sessionView(current);
  if (data.sessions.filter((s) => !s.finishedAt).length >= 8)
    throw new Error("Finish or leave an adventure before starting more.");
  const generated = createQuestions(skill, difficulty, data.storyProgress);
  const s = {
    id: randomUUID(),
    skill,
    difficulty,
    mode,
    startedAt: now,
    presentedAt: now,
    index: 0,
    attempts: [],
    ...generated,
  };
  data.sessions.push(s);
  return sessionView(s);
}
export function sessionView(s) {
  return {
    id: s.id,
    skill: s.skill,
    mode: s.mode,
    index: s.index,
    total: s.questions.length,
    question: s.pending ? null : publicQuestion(s.questions[s.index]),
    feedback: s.pending || null,
    finishedAt: s.finishedAt || null,
    correct: s.attempts.filter((a) => a.correct).length,
    stars: s.earned || 0,
  };
}
export function submitAnswer(data, id, input, now = Date.now()) {
  const s = data.sessions.find((x) => x.id === id);
  if (!s || s.finishedAt) throw new Error("Adventure not available.");
  if (s.pending) return sessionView(s); // retries cannot overwrite an answer or mint stars
  const q = s.questions[s.index];
  if (input.questionId !== q.id)
    throw new Error("This question has changed. Reload to continue.");
  const answer = String(input.answer ?? "").slice(0, 200);
  if (!answer.trim()) throw new Error("Enter an answer first.");
  if (
    q.options &&
    (!/^\d+$/.test(answer) || Number(answer) >= q.options.length)
  )
    throw new Error("Choose one of the answers.");
  const wallMs = Math.max(0, now - s.presentedAt),
    correct = grade(q, answer);
  s.attempts.push({
    questionId: q.id,
    prompt: q.prompt,
    answer: q.options ? q.options[Number(answer)] : answer,
    expected: q.options ? q.options[Number(q.answer)] : q.answer,
    correct,
    at: now,
    wallMs,
    activeMs: Math.max(0, Math.min(wallMs, Number(input.activeMs) || 0)),
    focusLosses: Math.min(1000, Math.max(0, Number(input.focusLosses) || 0)),
    helped: !!s.hintUsed || !!input.helped,
  });
  s.pending = {
    correct,
    explanation: q.explanation,
    answer: q.options ? q.options[Number(q.answer)] : q.answer,
  };
  return sessionView(s);
}
export function nextQuestion(data, id, now = Date.now()) {
  const s = data.sessions.find((x) => x.id === id);
  if (!s) throw new Error("Adventure not found.");
  if (s.finishedAt || !s.pending) return sessionView(s);
  s.index++;
  s.pending = null;
  s.hintUsed = false;
  s.presentedAt = now;
  if (s.index === s.questions.length) {
    s.finishedAt = now;
    const n = s.attempts.filter((a) => a.correct).length;
    s.earned = n;
    data.stars += n;
    if (s.skill === "stories")
      updateStoryProgress(data.storyProgress, s.rank, s.storyId, n);
  }
  return sessionView(s);
}
