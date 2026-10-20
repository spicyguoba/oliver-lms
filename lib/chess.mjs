import { randomInt, randomUUID } from "node:crypto";
import {
  Chess,
  chooseChessMove,
  chessOutcome,
  chessHint,
} from "./chess-engine.mjs";
import {
  CHESS_LESSONS,
  CHESS_LEVELS,
  CHESS_SCENARIOS,
  BOARD_THEMES,
  PIECE_THEMES,
} from "../content/chess-lessons.mjs";
import {
  createQuestions,
  publicQuestion,
  grade,
  skills,
} from "./questions.mjs";
import { awardConsistency, dailyStarSummary } from "./calendar.mjs";
const quizSkills = [
  "regrouping",
  "en-words-001",
  "weather",
  "continents",
  "chinese",
  "ice-age",
  "math-groups",
  "phonics",
  "space",
  "states",
  "zh-words-001",
  "science",
];
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const wireMove = (m) => ({
  from: m.from,
  to: m.to,
  ...(m.promotion ? { promotion: m.promotion } : {}),
  san: m.san,
  color: m.color,
  piece: m.piece,
});
export function restoreChess(g) {
  const c = new Chess(g.initialFen);
  for (const m of g.moves)
    c.move({
      from: m.from,
      to: m.to,
      ...(m.promotion ? { promotion: m.promotion } : {}),
    });
  return c;
}
function findGame(d, id) {
  const g = d.chess.games.find((g) => g.id === id);
  if (!g) fail("Chess game not found.", 404);
  return g;
}
function current(d, g, input) {
  if (!Number.isInteger(input.version) || input.version !== g.version)
    fail(
      "This board changed in another tab. Reload it before continuing.",
      409,
    );
}
function unresolved(d, g) {
  return d.chess.quizzes.find(
    (q) => q.id === g.quizId && q.status === "active",
  );
}
function touch(g, now) {
  g.version++;
  g.updatedAt = now;
}
function stateFor(d, g) {
  d.chess.selectedGame = g.id;
  return chessState(d);
}
function canUndo(g) {
  return (
    g.mode === "computer" &&
    g.status !== "stopped" &&
    g.moves.some((m) => m.color === g.color)
  );
}
export function chessQuizView(q) {
  if (!q) return null;
  const question = q.questions[q.index],
    attempt = q.attempts.find((a) => a.questionId === question.id);
  return {
    id: q.id,
    action: q.action,
    status: q.status,
    index: q.index,
    total: 3,
    passScore: 2,
    correct: q.attempts.filter((a) => a.correct).length,
    earned: q.earned || 0,
    bonuses: q.bonuses || [],
    question:
      q.status === "active"
        ? {
            ...publicQuestion(question),
            skillTitle: skills[question.skill]?.title,
            subject: skills[question.skill]?.subject,
          }
        : null,
    feedback: attempt
      ? {
          correct: attempt.correct,
          answer: attempt.expected,
          explanation: question.explanation,
          speech: question.explanationParts,
        }
      : null,
  };
}
export function chessGameView(d, g) {
  if (!g) return null;
  const c = restoreChess(g),
    lesson = CHESS_LESSONS.find((l) => l.id === g.lessonId),
    q = d.chess.quizzes.find((q) => q.id === g.quizId);
  const active = g.status === "active" && !unresolved(d, g);
  return {
    id: g.id,
    version: g.version,
    positionVersion: g.positionVersion,
    mode: g.mode,
    scenario: g.scenario || "standard",
    lessonId: g.lessonId || null,
    lesson: lesson || null,
    difficulty: g.difficulty,
    color: g.color,
    status: g.status,
    board: c.board().flat().filter(Boolean),
    turn: c.turn(),
    check: c.inCheck(),
    checkSquare: c.inCheck()
      ? c
          .board()
          .flat()
          .find((p) => p?.color === c.turn() && p.type === "k")?.square
      : null,
    legalMoves: active
      ? c.moves({ verbose: true }).map((m) => ({
          from: m.from,
          to: m.to,
          promotion: m.promotion || null,
          castle: m.flags.includes("k") || m.flags.includes("q"),
        }))
      : [],
    moves: g.moves.map((m) => ({ ...m })),
    outcome: g.outcome || null,
    feedback: g.feedback || null,
    hint: g.hint?.positionVersion === g.positionVersion ? g.hint : null,
    canHint: active && c.turn() === g.color && !g.hint,
    canUndo: canUndo(g) && !unresolved(d, g),
    quiz: chessQuizView(q),
    earned: g.earned || 0,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
    finishedAt: g.finishedAt || null,
  };
}
export function chessState(d, now = Date.now()) {
  return {
    learnerId: d.learnerId || "oliver",
    learnerName: d.profile.name,
    stars: d.stars,
    ...dailyStarSummary(d, now),
    timezone: d.settings.timezone,
    preferences: d.chess.preferences,
    game: chessGameView(
      d,
      d.chess.games.find((g) => g.id === d.chess.selectedGame),
    ),
    activeGameId: d.chess.activeGameId || null,
    lessons: d.chess.lessons,
    history: d.chess.games
      .slice(-12)
      .reverse()
      .map((g) => ({
        id: g.id,
        mode: g.mode,
        title: g.lessonId
          ? CHESS_LESSONS.find((l) => l.id === g.lessonId)?.title
          : `${CHESS_SCENARIOS[g.scenario || "standard"].name} · ${CHESS_LEVELS[g.difficulty - 1]?.name}`,
        status: g.status,
        outcome: g.outcome?.title,
        at: g.updatedAt,
      })),
  };
}
function appendMove(g, c, m, now) {
  g.moves.push({ ...wireMove(m), at: now });
  g.positionVersion++;
  g.hint = null;
}
function finish(g, c, now) {
  const outcome = chessOutcome(c);
  if (outcome) {
    g.status = "finished";
    g.outcome = outcome;
    g.finishedAt = now;
    g.finishes.push({ at: now, outcome, plies: g.moves.length });
  }
  return outcome;
}
export function startChess(d, input, now = Date.now()) {
  const lesson = CHESS_LESSONS.find((l) => l.id === input.lessonId);
  let existing;
  if (input.mode === "lesson") {
    if (!lesson) fail("Choose a chess lesson.");
    existing = d.chess.games.findLast(
      (g) => g.lessonId === lesson.id && g.status === "active",
    );
  } else {
    if (
      input.mode !== "computer" ||
      !Number.isInteger(input.difficulty) ||
      input.difficulty < 1 ||
      input.difficulty > 5 ||
      !["w", "b", "random"].includes(input.color) ||
      !Object.hasOwn(CHESS_SCENARIOS, input.scenario || "standard")
    )
      fail("Choose a computer level and your color.");
    const active = d.chess.games.find((g) => g.id === d.chess.activeGameId);
    if (active?.status === "active" && !input.replace) existing = active;
    if (active?.status === "active" && input.replace) {
      if (unresolved(d, active))
        fail(
          "Finish or close your study quiz before starting another game.",
          409,
        );
      active.status = "stopped";
      touch(active, now);
    }
  }
  if (existing) {
    d.chess.selectedGame = existing.id;
    return chessState(d);
  }
  const scenario = input.scenario || "standard";
  const c = new Chess(
      input.mode === "lesson"
        ? lesson.fen
        : CHESS_SCENARIOS[scenario].fen || undefined,
    ),
    g = {
      id: randomUUID(),
      version: 1,
      positionVersion: 0,
      engineVersion: 1,
      mode: input.mode,
      scenario: input.mode === "computer" ? scenario : null,
      lessonId: input.mode === "lesson" ? lesson.id : null,
      difficulty: input.mode === "computer" ? input.difficulty : null,
      color:
        input.mode === "lesson" || scenario !== "standard"
          ? "w"
          : input.color === "random"
            ? randomInt(2)
              ? "w"
              : "b"
            : input.color,
      initialFen: c.fen(),
      moves: [],
      undoEvents: [],
      lessonAttempts: [],
      finishes: [],
      status: "active",
      createdAt: now,
      updatedAt: now,
      earned: 0,
    };
  if (g.mode === "computer" && g.color === "b") {
    const move = chooseChessMove(c, g.difficulty);
    appendMove(g, c, c.move(move), now);
  }
  d.chess.games.push(g);
  d.chess.selectedGame = g.id;
  if (g.mode === "computer") d.chess.activeGameId = g.id;
  return stateFor(d, g);
}
export function openChess(d, id) {
  const g = findGame(d, id);
  d.chess.selectedGame = g.id;
  return stateFor(d, g);
}
export function moveChess(d, input, now = Date.now()) {
  const g = findGame(d, input.id);
  current(d, g, input);
  if (g.status !== "active")
    fail(
      "This position is finished. Try a lesson again or start a new game.",
      409,
    );
  if (unresolved(d, g)) fail("Finish or close your study quiz first.", 409);
  const c = restoreChess(g);
  if (c.turn() !== g.color) fail("Wait for your turn.", 409);
  if (
    !/^[a-h][1-8]$/.test(input.from) ||
    !/^[a-h][1-8]$/.test(input.to) ||
    (input.promotion !== undefined &&
      !["q", "r", "b", "n"].includes(input.promotion))
  )
    fail("Choose a legal destination.");
  let m;
  try {
    m = c.move({
      from: input.from,
      to: input.to,
      ...(input.promotion ? { promotion: input.promotion } : {}),
    });
  } catch {
    fail(
      "That move is not legal. Your king must stay safe. For castling, the route must be clear and safe.",
    );
  }
  appendMove(g, c, m, now);
  g.feedback = null;
  if (g.mode === "lesson") {
    const l = CHESS_LESSONS.find((l) => l.id === g.lessonId),
      outcome = chessOutcome(c);
    const success =
      l.goal === "castle-k"
        ? m.flags.includes("k")
        : l.goal === "castle-q"
          ? m.flags.includes("q")
          : l.goal === "escape"
            ? m.piece === "k" && !c.isGameOver()
            : l.goal === "keep-playing"
              ? m.piece === "q" && (!outcome || outcome.kind === "checkmate")
              : c.isCheckmate();
    g.lessonAttempts.push({ at: now, move: wireMove(m), success, outcome });
    g.feedback = {
      success,
      text: success
        ? l.success
        : outcome?.kind === "stalemate"
          ? outcome.explanation
          : l.goal.startsWith("castle")
            ? "Try castling with the king. Check whether its whole route is safe."
            : l.goal === "mate"
              ? "That is a legal move, but not checkmate yet. Check the king’s escape squares and protect your helper."
              : "Try moving the queen while leaving a legal reply, or giving checkmate.",
    };
    g.status = success ? "lesson-complete" : "lesson-retry";
    g.outcome = outcome;
    g.finishedAt = now;
    if (success) {
      const old = d.chess.lessons[l.id];
      g.earned = old ? 0 : 1;
      d.chess.lessons[l.id] = {
        firstCompletedAt: old?.firstCompletedAt || now,
        lastCompletedAt: now,
      };
      d.chess.completions.push({
        id: randomUUID(),
        gameId: g.id,
        lessonId: l.id,
        at: now,
        earned: g.earned,
      });
      d.stars += g.earned;
      g.bonuses = awardConsistency(d, now);
    }
  } else if (!finish(g, c, now)) {
    const ai = chooseChessMove(c, g.difficulty);
    if (ai) appendMove(g, c, c.move(ai), now);
    finish(g, c, now);
    if (g.moves.length >= 400 && g.status === "active") {
      g.status = "finished";
      g.finishedAt = now;
      g.outcome = {
        kind: "practice-limit",
        title: "Long practice game saved",
        explanation:
          "You reached 200 moves each. Keep this game in your history and try a fresh board.",
      };
      g.finishes.push({ at: now, outcome: g.outcome, plies: g.moves.length });
    }
  }
  touch(g, now);
  return stateFor(d, g);
}
export function retryChessLesson(d, input, now = Date.now()) {
  const g = findGame(d, input.id);
  current(d, g, input);
  if (
    g.mode !== "lesson" ||
    !["lesson-retry", "lesson-complete"].includes(g.status)
  )
    fail("Choose a lesson to try again.");
  if (unresolved(d, g)) fail("Close your study quiz first.");
  g.moves = [];
  g.positionVersion++;
  g.status = "active";
  g.feedback = null;
  g.outcome = null;
  g.hint = null;
  g.finishedAt = null;
  g.earned = 0;
  g.quizId = null;
  touch(g, now);
  return stateFor(d, g);
}
export function chessPreferences(d, input) {
  if (
    !Object.hasOwn(BOARD_THEMES, input.board) ||
    !Object.hasOwn(PIECE_THEMES, input.pieces)
  )
    fail("Choose a board and piece theme.");
  d.chess.preferences = { board: input.board, pieces: input.pieces };
  return {
    ok: true,
    learnerId: d.learnerId || "oliver",
    preferences: d.chess.preferences,
  };
}
export function beginChessQuiz(d, input, now = Date.now()) {
  const g = findGame(d, input.id);
  current(d, g, input);
  if (!["hint", "undo"].includes(input.action)) fail("Choose hint or undo.");
  if (unresolved(d, g)) return stateFor(d, g);
  if (input.action === "undo" && !canUndo(g))
    fail("Make a move before asking for undo.");
  if (
    input.action === "hint" &&
    (g.status !== "active" || g.hint || restoreChess(g).turn() !== g.color)
  )
    fail("A hint is not available for this position.");
  const offset = d.chess.quizzes.length * 3,
    questions = [];
  for (let i = 0; i < 3; i++) {
    const skill = quizSkills[(offset + i) % quizSkills.length];
    const recent = [
      ...d.sessions
        .filter((s) => s.skill === skill)
        .flatMap((s) => s.questions.map((q) => q.prompt)),
      ...d.chess.quizzes.flatMap((q) =>
        q.questions.filter((x) => x.skill === skill).map((x) => x.prompt),
      ),
    ];
    const q = createQuestions(skill, 1, d.storyProgress, recent).questions[0];
    questions.push({ ...q, skill });
  }
  const q = {
    id: randomUUID(),
    gameId: g.id,
    positionVersion: g.positionVersion,
    action: input.action,
    status: "active",
    questions,
    attempts: [],
    index: 0,
    pending: false,
    presentedAt: now,
    createdAt: now,
    earned: 0,
  };
  d.chess.quizzes.push(q);
  g.quizId = q.id;
  touch(g, now);
  return stateFor(d, g);
}
function quizFor(d, input) {
  const g = findGame(d, input.id),
    q = d.chess.quizzes.find((q) => q.id === input.quizId && q.gameId === g.id);
  if (!q || g.quizId !== q.id) fail("Study quiz not found.", 404);
  return { g, q };
}
function grant(d, g, q, now) {
  if (g.positionVersion !== q.positionVersion)
    fail("The board changed. Earn help for the new position.", 409);
  if (q.action === "hint") {
    const c = restoreChess(g);
    // Lessons can have an explicit goal other than the strongest game move.
    let hint;
    const lesson = CHESS_LESSONS.find((l) => l.id === g.lessonId);
    if (lesson) {
      const moves = c.moves({ verbose: true });
      const useful = moves.find((m) => {
        c.move(m);
        const success =
          lesson.goal === "castle-k"
            ? m.flags.includes("k")
            : lesson.goal === "castle-q"
              ? m.flags.includes("q")
              : lesson.goal === "escape"
                ? m.piece === "k"
                : lesson.goal === "keep-playing"
                  ? m.piece === "q" && (!c.isGameOver() || c.isCheckmate())
                  : c.isCheckmate();
        c.undo();
        return success;
      });
      if (useful)
        hint = {
          from: useful.from,
          to: useful.to,
          promotion: useful.promotion || null,
          san: useful.san,
          text: `Try ${useful.from} → ${useful.to}${useful.promotion ? " and promote to " + useful.promotion.toUpperCase() : ""}. ${lesson.task}`,
        };
    }
    g.hint = {
      ...(hint || chessHint(c)),
      positionVersion: g.positionVersion,
      quizId: q.id,
    };
  } else {
    const last = g.moves.findLastIndex((m) => m.color === g.color);
    if (last < 0) fail("There is no learner move to undo.");
    const removed = g.moves.splice(last);
    g.undoEvents.push({
      id: randomUUID(),
      at: now,
      quizId: q.id,
      removed,
      outcome: g.outcome || null,
    });
    g.positionVersion++;
    g.hint = null;
    g.outcome = null;
    g.status = "active";
    g.finishedAt = null;
    g.feedback = {
      text: "Your last move and the computer’s reply have been taken back. Try a different plan.",
    };
  }
  q.grantedAt = now;
}
export function answerChessQuiz(d, input, now = Date.now()) {
  const { g, q } = quizFor(d, input);
  const previous = q.attempts.find((a) => a.questionId === input.questionId);
  if (previous) return stateFor(d, g);
  current(d, g, input);
  if (q.status !== "active" || q.positionVersion !== g.positionVersion)
    fail("This study quiz is no longer active.", 409);
  const question = q.questions[q.index];
  if (input.questionId !== question.id || q.pending)
    fail("Answer the question on screen.", 409);
  const answer = String(input.answer ?? "").slice(0, 200);
  if (
    !answer.trim() ||
    (question.options &&
      (!/^\d+$/.test(answer) || Number(answer) >= question.options.length))
  )
    fail("Choose or enter an answer.");
  const wallMs = Math.max(0, now - q.presentedAt),
    correct = grade(question, answer);
  q.attempts.push({
    questionId: question.id,
    skill: question.skill,
    prompt: question.prompt,
    ...(question.context ? { context: question.context } : {}),
    answer: question.options ? question.options[Number(answer)] : answer,
    expected: question.options
      ? question.options[Number(question.answer)]
      : question.answer,
    correct,
    at: now,
    wallMs,
    activeMs: Math.max(0, Math.min(wallMs, Number(input.activeMs) || 0)),
    focusLosses: Math.min(1000, Math.max(0, Number(input.focusLosses) || 0)),
    helped: !!question.hintUsed || !!input.helped,
  });
  q.pending = true;
  if (q.attempts.length === 3) {
    const score = q.attempts.filter((a) => a.correct).length;
    q.status = score >= 2 ? "passed" : "failed";
    q.finishedAt = now;
    q.earned = score;
    d.stars += score;
    if (q.status === "passed") grant(d, g, q, now);
    q.bonuses = awardConsistency(d, now);
  }
  touch(g, now);
  return stateFor(d, g);
}
export function nextChessQuiz(d, input, now = Date.now()) {
  const { g, q } = quizFor(d, input);
  current(d, g, input);
  if (q.status === "active" && q.pending && q.index < 2) {
    q.index++;
    q.pending = false;
    q.presentedAt = now;
    touch(g, now);
  }
  return stateFor(d, g);
}
export function readChessQuiz(d, input) {
  const { g, q } = quizFor(d, input);
  current(d, g, input);
  if (q.status !== "active" || q.pending) fail("Read the current question.");
  q.questions[q.index].hintUsed = true;
  return { ok: true };
}
export function closeChessQuiz(d, input, now = Date.now()) {
  const { g, q } = quizFor(d, input);
  current(d, g, input);
  if (q.status === "active") {
    q.status = "abandoned";
    q.finishedAt = now;
  }
  g.quizId = null;
  touch(g, now);
  return stateFor(d, g);
}
export function chessParentHistory(d) {
  return {
    games: d.chess.games
      .map((g) => ({
        id: g.id,
        mode: g.mode,
        lessonId: g.lessonId,
        scenario: g.scenario || "standard",
        difficulty: g.difficulty,
        status: g.status,
        color: g.color,
        plies: g.moves.length,
        at: g.updatedAt,
        outcome: g.outcome,
        undoCount: g.undoEvents.length,
        earned: d.chess.completions
          .filter((c) => c.gameId === g.id)
          .reduce((n, c) => n + c.earned, 0),
      }))
      .reverse(),
    quizzes: d.chess.quizzes.map(({ questions, ...q }) => q).reverse(),
  };
}
