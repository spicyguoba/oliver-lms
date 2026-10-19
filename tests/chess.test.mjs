import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "../lib/store.mjs";
import { migrateFamily } from "../lib/migrations.mjs";
import { learnerData } from "../lib/learners.mjs";
import { exportForAccount } from "../lib/accounts.mjs";
import {
  Chess,
  chooseChessMove,
  chessOutcome,
  chessHint,
} from "../lib/chess-engine.mjs";
import { CHESS_LESSONS } from "../content/chess-lessons.mjs";
import {
  startChess,
  chessState,
  moveChess,
  beginChessQuiz,
  answerChessQuiz,
  nextChessQuiz,
  closeChessQuiz,
  retryChessLesson,
  chessPreferences,
  restoreChess,
  readChessQuiz,
  openChess,
} from "../lib/chess.mjs";
import { learningCalendar, studyStarsByDay } from "../lib/calendar.mjs";
import { localDay } from "../lib/dates.mjs";
const now = Date.parse("2026-10-19T15:00:00Z");
function game(d, params = {}) {
  return startChess(
    d,
    { mode: "computer", difficulty: 1, color: "w", ...params },
    now,
  ).game;
}
function input(g, more = {}) {
  return { id: g.id, version: g.version, ...more };
}
function passQuiz(d, g, action = "hint", score = 3) {
  let state = beginChessQuiz(d, input(g, { action }), now + 1000);
  const saved = d.chess.quizzes.at(-1);
  for (let i = 0; i < 3; i++) {
    const q = saved.questions[i],
      correct = i < score,
      answer = correct
        ? q.answer
        : q.options
          ? String((Number(q.answer) + 1) % q.options.length)
          : "999999";
    state = answerChessQuiz(
      d,
      input(state.game, {
        quizId: saved.id,
        questionId: q.id,
        answer,
        activeMs: 3000,
      }),
      now + 4000 + i * 4000,
    );
    if (i < 2)
      state = nextChessQuiz(
        d,
        input(state.game, { quizId: saved.id }),
        now + 5000 + i * 4000,
      );
  }
  return state;
}
function position(d, fen) {
  let g = game(d);
  const raw = d.chess.games.find((x) => x.id === g.id);
  raw.initialFen = fen;
  raw.moves = [];
  return chessState(d).game;
}
test("schema nine adds independent chess records without changing any existing field", () => {
  const d = seed();
  d.version = 8;
  delete d.chess;
  for (const x of Object.values(d.learners)) delete x.chess;
  d.stars = 57;
  const old = structuredClone(d);
  migrateFamily(d);
  assert.equal(d.version, 9);
  const strip = (x) => {
    const { chess, ...rest } = x;
    return rest;
  };
  assert.deepEqual(
    { ...strip(d), version: 8, learners: undefined },
    { ...old, learners: undefined },
  );
  for (const id of ["test1", "test2"])
    assert.deepEqual(strip(d.learners[id]), old.learners[id]);
  const after = structuredClone(d);
  migrateFamily(d);
  assert.deepEqual(d, after);
  chessPreferences(learnerData(d, "test1"), {
    board: "ocean",
    pieces: "letters",
  });
  assert.equal(d.chess.preferences.board, "forest");
  assert.equal(d.learners.test2.chess.games.length, 0);
});
test("all lessons have legal reachable goals; wrong moves teach and repeat completions never mint a second star", () => {
  const d = seed();
  for (const l of CHESS_LESSONS) {
    const c = new Chess(l.fen);
    assert.equal(c.isGameOver(), false, l.id);
    const moves = c.moves({ verbose: true });
    const m = moves.find((m) => {
      c.move(m);
      const success =
        l.goal === "castle-k"
          ? m.flags.includes("k")
          : l.goal === "castle-q"
            ? m.flags.includes("q")
            : l.goal === "escape"
              ? m.piece === "k"
              : l.goal === "keep-playing"
                ? m.piece === "q" && (!c.isGameOver() || c.isCheckmate())
                : c.isCheckmate();
      c.undo();
      return success;
    });
    assert.ok(m, l.id);
    let g = startChess(d, { mode: "lesson", lessonId: l.id }, now).game;
    let result = moveChess(
      d,
      input(g, {
        from: m.from,
        to: m.to,
        ...(m.promotion ? { promotion: m.promotion } : {}),
      }),
      now + 1000,
    );
    assert.equal(result.game.status, "lesson-complete", l.id);
    assert.equal(result.game.earned, 1);
    result = retryChessLesson(d, input(result.game), now + 2000);
    result = moveChess(
      d,
      input(result.game, {
        from: m.from,
        to: m.to,
        ...(m.promotion ? { promotion: m.promotion } : {}),
      }),
      now + 3000,
    );
    assert.equal(result.game.earned, 0);
  }
  assert.equal(d.stars, CHESS_LESSONS.length);
  assert.equal(
    d.chess.completions.reduce((n, c) => n + c.earned, 0),
    CHESS_LESSONS.length,
  );
  assert.equal(studyStarsByDay(d).get(localDay(now)), CHESS_LESSONS.length);
  let g = startChess(d, { mode: "lesson", lessonId: "rook-mate" }, now).game;
  const r = moveChess(d, input(g, { from: "a1", to: "a2" }), now);
  assert.equal(r.game.status, "lesson-retry");
  assert.equal(r.game.feedback.success, false);
});
test("castling rejects check, through-check, blocked paths and permanently lost rights", () => {
  const blocked = new Chess();
  assert.ok(!blocked.moves().includes("O-O"));
  const through = new Chess("1k3r2/8/8/8/8/8/8/R3K2R w KQ - 0 1");
  assert.ok(!through.moves().includes("O-O"));
  assert.ok(through.moves().includes("O-O-O"));
  const checked = new Chess("k3r3/8/8/8/8/8/8/4K2R w K - 0 1");
  assert.ok(checked.inCheck());
  assert.ok(!checked.moves().includes("O-O"));
  const c = new Chess("4k3/8/8/8/8/8/8/4K2R w K - 0 1");
  c.move("Rh2");
  c.move("Kd7");
  c.move("Rh1");
  c.move("Ke8");
  assert.ok(!c.moves().includes("O-O"));
  const legal = new Chess("4k3/8/8/8/8/8/8/4K2R w K - 0 1");
  legal.move("O-O");
  assert.equal(legal.get("g1").type, "k");
  assert.equal(legal.get("f1").type, "r");
});
test("checkmate and stalemate have different explanations; all four promotions and en passant remain legal", () => {
  const mate = new Chess("7k/6Q1/5K2/8/8/8/8/8 b - - 0 1"),
    stale = new Chess("7k/8/5KQ1/8/8/8/8/8 b - - 0 1");
  assert.equal(chessOutcome(mate).kind, "checkmate");
  assert.equal(chessOutcome(stale).kind, "stalemate");
  assert.equal(stale.inCheck(), false);
  for (const p of ["q", "r", "b", "n"]) {
    const c = new Chess("7k/5P2/6K1/8/8/8/8/8 w - - 0 1");
    c.move({ from: "f7", to: "f8", promotion: p });
    assert.equal(c.get("f8").type, p);
  }
  const c = new Chess("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2");
  c.move({ from: "e5", to: "d6" });
  assert.equal(c.get("d5"), undefined);
  assert.equal(c.get("d6").type, "p");
});
test("five bounded AI settings return legal moves without mutating the supplied game; stronger settings find mate", () => {
  for (let level = 1; level <= 5; level++) {
    const c = new Chess(),
      fen = c.fen(),
      move = chooseChessMove(c, level, () => 0.25);
    assert.equal(c.fen(), fen);
    assert.equal(c.history().length, 0);
    assert.ok(
      c
        .moves({ verbose: true })
        .some((m) => m.from === move.from && m.to === move.to),
    );
    assert.ok((move.nodes || 0) <= 6502);
  }
  for (const l of CHESS_LESSONS.filter((l) => l.goal === "mate")) {
    const c = new Chess(l.fen);
    c.move(chooseChessMove(c, 3, () => 0.5));
    assert.ok(c.isCheckmate(), l.id);
  }
  const c = new Chess("7k/8/4QK2/8/8/8/8/8 w - - 0 1");
  const hint = chessHint(c);
  c.move(hint);
  assert.equal(c.isStalemate(), false);
});
test("human and computer turns save atomically, Black gets an opening move, stale/illegal inputs cannot rewrite a board", () => {
  const d = seed();
  let g = game(d);
  const old = structuredClone(d);
  assert.throws(
    () => moveChess(d, input(g, { from: "e2", to: "e5" })),
    /not legal/,
  );
  assert.deepEqual(d, old);
  const state = moveChess(
    d,
    input(g, { from: "e2", to: "e4", fen: "fake" }),
    now + 1000,
  );
  assert.equal(state.game.moves.length, 2);
  assert.equal(state.game.turn, "w");
  assert.equal(restoreChess(d.chess.games[0]).history().length, 2);
  assert.throws(
    () => moveChess(d, input(g, { from: "d2", to: "d4" })),
    /another tab/,
  );
  const black = game(d, { color: "b", replace: true });
  assert.equal(black.color, "b");
  assert.equal(black.moves.length, 1);
  assert.equal(black.turn, "b");
  assert.equal(black.canUndo, false);
  assert.throws(
    () => chessPreferences(d, { board: "invalid", pieces: "classic" }),
    /theme/,
  );
});
test("a hint needs 2/3; first answers and passed grants are immutable and persist through reload", () => {
  const d = seed(),
    g = game(d);
  let state = beginChessQuiz(d, input(g, { action: "hint" }), now);
  assert.equal(state.game.hint, null);
  assert.equal(state.game.quiz.question.answer, undefined);
  assert.equal(state.game.quiz.question.explanation, undefined);
  assert.equal(state.game.canHint, false);
  const q = d.chess.quizzes.at(-1),
    question = q.questions[0];
  assert.throws(
    () => moveChess(d, input(state.game, { from: "e2", to: "e4" })),
    /quiz/,
  );
  state = answerChessQuiz(
    d,
    input(state.game, {
      quizId: q.id,
      questionId: question.id,
      answer: question.answer,
    }),
    now + 1000,
  );
  const old = structuredClone(q.attempts[0]);
  state = answerChessQuiz(
    d,
    input(state.game, {
      quizId: q.id,
      questionId: question.id,
      answer: "wrong",
    }),
    now + 2000,
  );
  assert.deepEqual(q.attempts[0], old);
  state = nextChessQuiz(d, input(state.game, { quizId: q.id }), now + 2000);
  for (let i = 1; i < 3; i++) {
    const question = q.questions[i];
    state = answerChessQuiz(
      d,
      input(state.game, {
        quizId: q.id,
        questionId: question.id,
        answer:
          i === 1
            ? question.answer
            : question.options
              ? String((Number(question.answer) + 1) % question.options.length)
              : "999999",
      }),
      now + 3000 * i,
    );
    if (i < 2)
      state = nextChessQuiz(d, input(state.game, { quizId: q.id }), now + 4000);
  }
  assert.equal(q.status, "passed");
  assert.equal(q.earned, 2);
  assert.ok(state.game.hint);
  assert.equal(d.stars, 2);
  const snapshot = structuredClone(d);
  answerChessQuiz(
    d,
    input(state.game, {
      quizId: q.id,
      questionId: q.questions[2].id,
      answer: q.questions[2].answer,
    }),
    now + 12000,
  );
  assert.deepEqual(d, snapshot);
  assert.ok(chessState(structuredClone(d)).game.hint);
  state = closeChessQuiz(d, input(state.game, { quizId: q.id }));
  assert.equal(state.game.quiz, null);
  assert.throws(
    () => beginChessQuiz(d, input(state.game, { action: "hint" })),
    /not available/,
  );
});
test("failed and abandoned quizzes never grant help; reading is recorded; a fresh quiz rotates topics", () => {
  const d = seed();
  let g = game(d);
  let state = beginChessQuiz(d, input(g, { action: "hint" }), now);
  const q = d.chess.quizzes.at(-1);
  readChessQuiz(d, input(state.game, { quizId: q.id }));
  assert.ok(q.questions[0].hintUsed);
  state = closeChessQuiz(d, input(state.game, { quizId: q.id }));
  assert.equal(q.status, "abandoned");
  assert.equal(d.stars, 0);
  const first = q.questions.map((x) => x.skill);
  state = passQuiz(d, state.game, "hint", 1);
  const failed = d.chess.quizzes.at(-1);
  assert.equal(failed.status, "failed");
  assert.equal(state.game.hint, null);
  assert.equal(d.stars, 1);
  assert.notDeepEqual(
    failed.questions.map((x) => x.skill),
    first,
  );
  assert.equal(
    learningCalendar(d, "2026-10", now, true)
      .days.flatMap((d) => d.events)
      .filter((e) => e.mode === "chess help study quiz").length,
    1,
  );
});
test("earned undo removes exactly the learner turn plus reply once; history and castling rights survive reconstruction", () => {
  const d = seed();
  let g = game(d);
  let state = moveChess(d, input(g, { from: "e2", to: "e4" }), now + 1000);
  assert.equal(state.game.moves.length, 2);
  state = passQuiz(d, state.game, "undo", 2);
  assert.equal(state.game.moves.length, 0);
  assert.equal(state.game.turn, "w");
  assert.equal(d.chess.games[0].undoEvents.length, 1);
  assert.equal(d.chess.games[0].undoEvents[0].removed.length, 2);
  assert.equal(restoreChess(d.chess.games[0]).fen(), new Chess().fen());
  assert.equal(d.stars, 2);
  assert.ok(
    learningCalendar(d, "2026-10", now)
      .days.flatMap((day) => day.events)
      .some(
        (e) => e.summary?.includes("2 chess turns practised") && e.stars === 0,
      ),
  );
  const q = d.chess.quizzes.at(-1);
  answerChessQuiz(
    d,
    input(state.game, {
      quizId: q.id,
      questionId: q.questions[2].id,
      answer: q.questions[2].answer,
    }),
  );
  assert.equal(d.chess.games[0].undoEvents.length, 1);
});
test("undo is available after stalemate and restores a playable board, and repetition is reconstructed from moves", () => {
  const d = seed();
  let g = position(d, "7k/8/4QK2/8/8/8/8/8 w - - 0 1");
  let state = moveChess(d, input(g, { from: "e6", to: "f7" }), now);
  assert.equal(state.game.outcome.kind, "stalemate");
  assert.equal(state.game.canUndo, true);
  state = passQuiz(d, state.game, "undo", 3);
  assert.equal(state.game.status, "active");
  assert.equal(state.game.moves.length, 0);
  assert.ok(state.game.legalMoves.length);
  const c = new Chess();
  const moves = ["Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6", "Ng1", "Ng8"].map(
    (s) => {
      const m = c.move(s);
      return { from: m.from, to: m.to };
    },
  );
  const restored = restoreChess({ initialFen: new Chess().fen(), moves });
  assert.equal(chessOutcome(restored).kind, "repetition");
});
test("chess records and help remain scoped to one learner and parent exports; calendars hide answer keys/timing from students", () => {
  const family = seed(),
    d = learnerData(family, "test1");
  let g = game(d);
  let state = passQuiz(d, g, "hint", 3);
  assert.throws(
    () => openChess(learnerData(family, "test2"), g.id),
    /not found/,
  );
  assert.equal(family.stars, 0);
  assert.equal(family.learners.test2.chess.games.length, 0);
  const child = learningCalendar(d, "2026-10", now),
    parent = learningCalendar(d, "2026-10", now, true);
  assert.ok(!JSON.stringify(child).includes("expected"));
  assert.ok(!JSON.stringify(child).includes("wallMs"));
  assert.equal(
    parent.days[0].events.find((e) => e.mode === "chess help study quiz")
      .attempts.length,
    3,
  );
  assert.equal(studyStarsByDay(d).get(localDay(now)), 3);
  assert.equal(
    exportForAccount(family, { role: "parent", learnerId: "test2" }).chess.games
      .length,
    0,
  );
  assert.equal(
    exportForAccount(family, { role: "parent", learnerId: "test1" }).chess
      .quizzes[0].attempts.length,
    3,
  );
});
test("endgame practice uses only server-defined boards and keeps the learner on the attacking side", () => {
  for (const scenario of ["queen", "rook", "ladder"]) {
    const d = seed(),
      g = game(d, { scenario, color: "b" });
    assert.equal(g.scenario, scenario);
    assert.equal(g.color, "w");
    assert.equal(g.status, "active");
    assert.ok(g.board.length >= 3 && g.board.length <= 4);
    assert.ok(g.legalMoves.length);
    assert.equal(g.moves.length, 0);
  }
  const d = seed();
  assert.throws(
    () => game(d, { scenario: "injected-fen" }),
    /level and your color/,
  );
  assert.equal(d.chess.games.length, 0);
  assert.equal(
    chessOutcome(new Chess("8/8/8/8/8/2k5/8/K6R w - - 100 51")).kind,
    "fifty",
  );
  assert.equal(
    chessOutcome(new Chess("7k/8/8/8/8/8/8/K7 w - - 0 1")).kind,
    "material",
  );
});
test("lesson replays preserve dated study stars; chess learning reaches the same 21-star threshold once", () => {
  const d = seed();
  d.stars = 20;
  d.completions.push({
    id: "base",
    assignmentId: "base",
    title: "Earlier study",
    status: "approved",
    day: localDay(now),
    at: now,
    earned: 20,
  });
  let g = startChess(d, { mode: "lesson", lessonId: "castle-king" }, now).game;
  let state = moveChess(d, input(g, { from: "e1", to: "g1" }), now + 1000);
  assert.equal(d.stars, 23);
  assert.equal(studyStarsByDay(d).get(localDay(now)), 21);
  state = retryChessLesson(d, input(state.game), now + 86400000);
  moveChess(d, input(state.game, { from: "e1", to: "g1" }), now + 86401000);
  assert.equal(d.stars, 23);
  assert.equal(studyStarsByDay(d).get(localDay(now)), 21);
  assert.equal(studyStarsByDay(d).get(localDay(now + 86400000)), 0);
  assert.equal(
    d.consistencyAwards.filter((a) => a.kind === "practice").length,
    1,
  );
});
