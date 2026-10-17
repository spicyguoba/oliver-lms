import { randomInt, randomUUID } from "node:crypto";
import { dashCourse, dashLevel, replayDash } from "./dash-engine.mjs";
import {
  createQuestions,
  publicQuestion,
  grade,
  skills,
} from "./questions.mjs";
import { awardConsistency } from "./calendar.mjs";

const questionSkills = [
  "regrouping",
  "en-words-001",
  "fractions",
  "phonics",
  "math-groups",
  "zh-words-001",
  "math-sharing",
  "weather",
  "math-place",
  "continents",
  "math-coins",
  "en-usage-035",
  "math-area",
  "ice-age",
  "states",
  "zh-usage-025",
  "math-fractions-equal",
  "en-usage-075",
  "math-fractions-add",
  "math-decimals",
];
function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
export function dashView(d, run) {
  if (!run) return null;
  return {
    id: run.id,
    level: run.level,
    seed: run.seed,
    status: run.status,
    learnerId: d.learnerId || "oliver",
    learnerName: d.profile.name,
    question: run.status === "question" ? publicQuestion(run.question) : null,
    skill: run.skill,
    skillTitle: skills[run.skill]?.title,
    subject: skills[run.skill]?.subject,
    feedback: run.attempt
      ? {
          correct: run.attempt.correct,
          answer: run.attempt.expected,
          explanation: run.question.explanation,
          speech: run.question.explanationParts,
          stars: run.earned,
          bonuses: run.bonuses || [],
        }
      : null,
  };
}
export function dashState(d) {
  return {
    unlocked: d.dash.unlocked,
    levels: d.dash.levels,
    pending: dashView(
      d,
      d.dash.runs.findLast((r) => r.status === "question"),
    ),
    learnerId: d.learnerId || "oliver",
    learnerName: d.profile.name,
    stars: d.stars,
    timezone: d.settings.timezone,
  };
}
export function startDash(d, level, now = Date.now()) {
  if (
    !Number.isInteger(level) ||
    level < 1 ||
    level > 20 ||
    level > d.dash.unlocked
  )
    fail("Choose an unlocked Star Dash level.");
  const pending = d.dash.runs.findLast((r) => r.status === "question");
  if (pending) return dashView(d, pending);
  const active = d.dash.runs.findLast((r) => r.status === "running");
  if (active?.level === level) return dashView(d, active);
  if (active) {
    active.status = "abandoned";
    active.abandonedAt = now;
  }
  const run = {
    id: randomUUID(),
    level,
    seed: randomInt(2147483647),
    engineVersion: 1,
    startedAt: now,
    status: "running",
  };
  d.dash.runs.push(run);
  return dashView(d, run);
}
export function finishDash(d, id, input, now = Date.now()) {
  const run = d.dash.runs.find((r) => r.id === id);
  if (!run) fail("Star Dash run not found.", 404);
  if (["question", "answered"].includes(run.status)) return dashView(d, run);
  if (run.status !== "running") fail("Start this Star Dash level again.");
  const course = dashCourse(run.level, run.seed),
    jumps = input.jumps;
  if (
    !Array.isArray(jumps) ||
    jumps.length > 200 ||
    jumps.some(
      (n, i) =>
        !Number.isInteger(n) ||
        n < 0 ||
        n >= course.durationFrames ||
        (i > 0 && n <= jumps[i - 1]),
    )
  )
    fail("This jump trace is invalid. Replay the level.");
  if (now - run.startedAt < (course.durationFrames / 60) * 1000 - 150)
    fail("Finish the course before claiming its question.");
  if (!replayDash(course, jumps).won)
    fail("The course was not cleared. Try another jump!");
  run.clearedAt = now;
  run.presentedAt = now;
  run.status = "question";
  run.skill = questionSkills[run.level - 1];
  const recent = d.dash.runs
    .filter((r) => r.skill === run.skill && r.question)
    .map((r) => r.question.prompt);
  run.question = createQuestions(
    run.skill,
    run.level > 10 ? 2 : 1,
    d.storyProgress,
    recent,
  ).questions[0];
  const progress = d.dash.levels[run.level] || { clears: 0 };
  progress.clears++;
  progress.lastClearAt = now;
  d.dash.levels[run.level] = progress;
  d.dash.unlocked = Math.max(d.dash.unlocked, Math.min(20, run.level + 1));
  return dashView(d, run);
}
export function answerDash(d, id, input, now = Date.now()) {
  const run = d.dash.runs.find((r) => r.id === id);
  if (!run) fail("Star Dash run not found.", 404);
  if (run.attempt) return dashView(d, run);
  if (run.status !== "question" || input.questionId !== run.question.id)
    fail("Clear the course to reveal its study question.");
  const q = run.question,
    answer = String(input.answer ?? "").slice(0, 200);
  if (
    !answer.trim() ||
    (q.options && (!/^\d+$/.test(answer) || Number(answer) >= q.options.length))
  )
    fail("Choose or enter an answer first.");
  const correct = grade(q, answer),
    wallMs = Math.max(0, now - run.presentedAt);
  run.attempt = {
    questionId: q.id,
    prompt: q.prompt,
    ...(q.context ? { context: q.context } : {}),
    answer: q.options ? q.options[Number(answer)] : answer,
    expected: q.options ? q.options[Number(q.answer)] : q.answer,
    correct,
    at: now,
    wallMs,
    activeMs: Math.max(0, Math.min(wallMs, Number(input.activeMs) || 0)),
    focusLosses: Math.min(1000, Math.max(0, Number(input.focusLosses) || 0)),
    helped: !!run.hintUsed || !!input.helped,
  };
  const progress = d.dash.levels[run.level];
  progress.lastAnsweredAt = now;
  progress.lastCorrect = correct;
  run.earned = correct && !progress.starredAt ? dashLevel(run.level).reward : 0;
  if (run.earned) {
    progress.starredAt = now;
    d.stars += run.earned;
  }
  run.status = "answered";
  run.bonuses = awardConsistency(d, now);
  return dashView(d, run);
}
export function hintDash(d, id) {
  const run = d.dash.runs.find((r) => r.id === id);
  if (!run || run.status !== "question") fail("Study question unavailable.");
  run.hintUsed = true;
  return { ok: true };
}
