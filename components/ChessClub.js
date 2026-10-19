"use client";
import { useEffect, useRef, useState } from "react";
import { api, ErrorBox, Loading, Login } from "./ui";
import ChessBoard, { ChessPiece } from "./ChessBoard";
import ChessHelpQuiz from "./ChessHelpQuiz";
import { speakParts } from "./WordLesson";
import {
  CHESS_LESSONS,
  CHESS_LEVELS,
  CHESS_SCENARIOS,
  BOARD_THEMES,
  PIECE_THEMES,
  PIECE_NAMES,
} from "../content/chess-lessons.mjs";
export default function ChessClub() {
  const [data, setData] = useState(null),
    [hub, setHub] = useState(false),
    [login, setLogin] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState(null),
    [promotion, setPromotion] = useState(null),
    [notice, setNotice] = useState(""),
    [setupScenario, setSetupScenario] = useState("standard");
  const promotionDialog = useRef(null);
  const game = data?.game;
  useEffect(() => {
    if (!promotion) return;
    const prior = document.activeElement,
      node = promotionDialog.current;
    node?.querySelector("button")?.focus();
    function trap(e) {
      if (e.key === "Escape") {
        setPromotion(null);
        return;
      }
      if (e.key !== "Tab") return;
      const items = [...node.querySelectorAll("button:not(:disabled)")],
        first = items[0],
        last = items.at(-1);
      if (
        !node.contains(document.activeElement) ||
        (!e.shiftKey && document.activeElement === last)
      ) {
        e.preventDefault();
        first?.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
    }
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      prior?.focus();
    };
  }, [!!promotion]);
  useEffect(() => {
    let active = true;
    api("chess")
      .then((d) => {
        if (active) {
          setData(d);
          setHub(!d.game);
        }
      })
      .catch((e) => {
        if (active) e.status === 401 ? setLogin(true) : setError(e.message);
      });
    return () => {
      active = false;
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    setSelected(null);
    setPromotion(null);
    setNotice("");
  }, [game?.id, game?.positionVersion]);
  useEffect(() => {
    if (!data) return;
    async function refresh() {
      if (busy) return;
      try {
        setData(await api("chess"));
      } catch (e) {
        setError(e.message);
      }
    }
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [!!data, busy]);
  async function act(route, body = {}) {
    if (busy) return;
    setBusy(true);
    setError("");
    window.speechSynthesis?.cancel();
    try {
      const r = await api(route, {
        ...(game ? { id: game.id, version: game.version } : {}),
        ...body,
      });
      if (route === "chess/preferences")
        setData((d) => ({ ...d, preferences: r.preferences }));
      else {
        setData(r);
        if (["chess/start", "chess/open"].includes(route)) {
          setHub(false);
          window.scrollTo({ top: 0 });
        }
      }
      return r;
    } catch (e) {
      setError(e.message);
      if (e.status === 401) setLogin(true);
      if (e.status === 409)
        try {
          setData(await api("chess"));
        } catch {}
    } finally {
      setBusy(false);
    }
  }
  function select(square) {
    if (
      busy ||
      !game ||
      game.status !== "active" ||
      game.quiz?.status === "active"
    )
      return;
    const choices = game.legalMoves.filter(
      (m) => m.from === selected && m.to === square,
    );
    if (choices.length) {
      if (choices.some((m) => m.promotion)) {
        setPromotion({ from: selected, to: square, choices });
        return;
      }
      act("chess/move", { from: selected, to: square });
      return;
    }
    const piece = game.board.find((p) => p.square === square);
    if (piece?.color === game.color) {
      setSelected(square === selected ? null : square);
      setNotice(
        piece.type === "k"
          ? "To castle, choose your king, then its two-square destination if marked legal."
          : "Tap a marked square to move.",
      );
    } else
      setNotice("Choose one of your pieces, then tap a marked destination.");
  }
  if (login) return <Login />;
  if (!data)
    return (
      <main className="quiz-shell">
        <Loading />
        <ErrorBox message={error} />
        <a href="/">Adventure home</a>
      </main>
    );
  const theme = BOARD_THEMES[data.preferences.board],
    pieces = data.preferences.pieces;
  const lesson = game?.lesson,
    next =
      lesson &&
      CHESS_LESSONS[CHESS_LESSONS.findIndex((l) => l.id === lesson.id) + 1];
  const openQuiz = game?.quiz;
  const scenario = CHESS_SCENARIOS[game?.scenario || "standard"];
  const outcomeTitle =
    game?.outcome?.kind === "checkmate"
      ? game.outcome.winner === game.color
        ? "Checkmate · You found it!"
        : "Checkmate · Computer won this time"
      : game?.outcome?.title;
  return (
    <main className="chess-shell">
      <header className="chess-header">
        <a href="/#games">← Adventure home</a>
        <strong>♞ CHESS CLUB</strong>
        <span>
          {data.learnerName} · ★ {data.stars}
        </span>
      </header>
      <div className="chess-intro">
        <p className="eyebrow">THINK. TRY. DISCOVER.</p>
        <h1>
          {hub
            ? "Build a clever little plan."
            : lesson
              ? `${lesson.icon} ${lesson.title}`
              : "Your next move awaits."}
        </h1>
        <p>
          {hub
            ? "Make a castle, find checkmate, and leave a doorway when you need one."
            : lesson
              ? lesson.task
              : `You play ${game?.color === "b" ? "Black" : "White"} · ${CHESS_LEVELS[(game?.difficulty || 1) - 1].name} · No clock. Take your time.`}
        </p>
      </div>
      <ErrorBox message={error} />
      <div className="chess-toolbar">
        <button
          disabled={busy}
          onClick={() => {
            setHub((h) => !h);
            window.scrollTo({ top: 0 });
          }}
        >
          {hub && game ? "↩ Back to my board" : "📖 Lessons & new game"}
        </button>
        <label>
          Board
          <select
            aria-label="Board theme"
            value={data.preferences.board}
            disabled={busy}
            onChange={(e) =>
              act("chess/preferences", { board: e.target.value, pieces })
            }
          >
            {Object.entries(BOARD_THEMES).map(([id, t]) => (
              <option key={id} value={id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Pieces
          <select
            aria-label="Piece theme"
            value={pieces}
            disabled={busy}
            onChange={(e) =>
              act("chess/preferences", {
                board: data.preferences.board,
                pieces: e.target.value,
              })
            }
          >
            {Object.entries(PIECE_THEMES).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {hub ? (
        <>
          <section className="chess-new-game">
            <div>
              <span className="chess-big-knight">♞</span>
              <h2>Play a computer friend</h2>
              <p>
                Five club difficulty settings. Start gently, then try a deeper
                thinker. These are practice levels, not chess ratings.
              </p>
              {data.activeGameId && (
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => act("chess/open", { id: data.activeGameId })}
                >
                  Open my saved computer game
                </button>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                act("chess/start", {
                  mode: "computer",
                  difficulty: Number(f.get("difficulty")),
                  color: setupScenario === "standard" ? f.get("color") : "w",
                  scenario: setupScenario,
                  replace: true,
                });
              }}
            >
              <label>
                Computer level
                <select name="difficulty" defaultValue="1">
                  {CHESS_LEVELS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.id} · {l.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Starting board
                <select
                  name="scenario"
                  value={setupScenario}
                  onChange={(e) => setSetupScenario(e.target.value)}
                >
                  {Object.entries(CHESS_SCENARIOS).map(([id, s]) => (
                    <option key={id} value={id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                My pieces
                <select
                  name="color"
                  defaultValue="w"
                  disabled={setupScenario !== "standard"}
                >
                  <option value="w">White · I move first</option>
                  <option value="b">Black · Computer moves first</option>
                  <option value="random">Surprise me</option>
                </select>
              </label>
              {setupScenario !== "standard" && (
                <small>
                  Endgame practice: you lead the White pieces toward checkmate.
                  Your coach will guide the plan.
                </small>
              )}
              <button className="button" disabled={busy}>
                {busy ? "Getting your board…" : "Start a new game →"}
              </button>
              <small>
                A new game ends your current computer game and keeps it in your
                history.
              </small>
            </form>
          </section>
          <div className="chess-lessons-heading">
            <h2>Your little chess school</h2>
            <span>
              {Object.keys(data.lessons).length}/{CHESS_LESSONS.length} learned
            </span>
          </div>
          <p>
            Read a short guide, then try the position. First completion earns
            one star. Replays keep your progress.
          </p>
          <div className="chess-lesson-grid">
            {CHESS_LESSONS.map((l, i) => (
              <button
                key={l.id}
                className={`chess-lesson-card ${data.lessons[l.id] ? "completed" : ""}`}
                disabled={busy}
                onClick={() =>
                  act("chess/start", { mode: "lesson", lessonId: l.id })
                }
              >
                <span>{l.icon}</span>
                <small>
                  {i + 1} · {l.topic}
                </small>
                <h3>{l.title}</h3>
                <p>{l.task}</p>
                <b>
                  {data.lessons[l.id]
                    ? "✓ Learned · practice again"
                    : "Try this lesson →"}
                </b>
                {data.lessons[l.id] && (
                  <small>
                    Last:{" "}
                    {new Date(
                      data.lessons[l.id].lastCompletedAt,
                    ).toLocaleDateString("en-US", {
                      timeZone: data.timezone,
                      month: "short",
                      day: "numeric",
                    })}
                  </small>
                )}
              </button>
            ))}
          </div>
          <details className="chess-guide">
            <summary>Why was it a draw?</summary>
            <p>
              Stalemate means the player to move is not in check, but has no
              legal move with any piece. Checkmate means the king is in check
              and there is no legal escape.
            </p>
            <p>
              Before finishing with an extra queen or rook, ask: “Is their king
              in check? If not, where can they move?” A draw is not a loss, and
              saving a draw can be a great result.
            </p>
            <p>
              These practice games automatically end on threefold repetition,
              fifty moves by each side without a pawn move or capture, and
              common insufficient-material draws. Tournament claim procedures
              and clocks are not used here.
            </p>
          </details>
          {data.history.length > 0 && (
            <details className="chess-guide">
              <summary>My recent chess boards</summary>
              {data.history.map((g) => (
                <div className="chess-history-row" key={g.id}>
                  <span>
                    {g.title} · {g.outcome || g.status.replaceAll("-", " ")} ·{" "}
                    {new Date(g.at).toLocaleDateString("en-US", {
                      timeZone: data.timezone,
                    })}
                  </span>
                  <button
                    disabled={busy}
                    onClick={() => act("chess/open", { id: g.id })}
                  >
                    Open board
                  </button>
                </div>
              ))}
            </details>
          )}
        </>
      ) : (
        game && (
          <>
            <div className="chess-play-layout">
              <div>
                <div
                  className={`chess-turn ${game.check ? "check" : ""}`}
                  role="status"
                >
                  <strong>
                    {busy
                      ? "Thinking…"
                      : game.status === "active"
                        ? `${game.turn === "w" ? "White" : "Black"} to move${game.check ? " · CHECK!" : ""}`
                        : outcomeTitle ||
                          (game.status === "lesson-complete"
                            ? "Lesson learned!"
                            : game.status === "lesson-retry"
                              ? "Try another plan"
                              : "Saved board")}
                  </strong>
                  <span>
                    {game.status === "active"
                      ? game.check
                        ? "Your king must be made safe."
                        : "Tap a piece, then a marked square."
                      : game.outcome?.explanation}
                  </span>
                </div>
                <ChessBoard
                  key={game.id}
                  game={game}
                  theme={theme}
                  pieces={pieces}
                  selected={selected}
                  onSelect={select}
                  disabled={busy || game.status !== "active" || !!openQuiz}
                />
                <p className="chess-board-note" aria-live="polite">
                  {notice ||
                    "Your game saves after each turn. Switch devices or take a break anytime."}
                </p>
                <div className="chess-help-actions">
                  <button
                    disabled={busy || !game.canHint}
                    onClick={() => act("chess/quiz", { action: "hint" })}
                  >
                    💡 Earn a hint <small>Quiz: 2 of 3 correct</small>
                  </button>
                  {game.mode === "computer" && (
                    <button
                      disabled={busy || !game.canUndo}
                      onClick={() => act("chess/quiz", { action: "undo" })}
                    >
                      ↶ Earn undo <small>My move + computer reply</small>
                    </button>
                  )}
                </div>
                <p className="chess-small-copy">
                  Each passed quiz unlocks one action for this position. No
                  stars are spent.
                </p>
              </div>
              <aside className="chess-coach">
                {game.hint && (
                  <section className="chess-earned-tip">
                    <h2>💡 Your earned hint</h2>
                    <p>{game.hint.text}</p>
                    <small>
                      The two highlighted squares show the move. A club hint is
                      a suggestion, not a guarantee of perfect play.
                    </small>
                  </section>
                )}
                {game.feedback && (
                  <section
                    className={
                      game.feedback.success ? "chess-success" : "chess-guide"
                    }
                    role="status"
                  >
                    <h2>
                      {game.feedback.success
                        ? "✓ You did it!"
                        : "A clue for next time"}
                    </h2>
                    <p>{game.feedback.text}</p>
                    {game.status === "lesson-complete" && (
                      <p>
                        {game.earned
                          ? `+${game.earned} ★ first completion`
                          : "Your lesson star is already collected."}
                      </p>
                    )}
                  </section>
                )}
                {lesson ? (
                  <section className="chess-guide">
                    <h2>{lesson.icon} Coach’s guide</h2>
                    <button
                      className="text-button"
                      onClick={() => speakParts(lesson.guide.map((p) => [p]))}
                    >
                      🔊 Read guide aloud
                    </button>
                    {lesson.guide.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                    <p>
                      <b>Your mission:</b> {lesson.task}
                    </p>
                    {["lesson-retry", "lesson-complete"].includes(
                      game.status,
                    ) && (
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() => act("chess/retry")}
                      >
                        Try this lesson again
                      </button>
                    )}
                    {game.status === "lesson-complete" && next && (
                      <button
                        className="button"
                        disabled={busy}
                        onClick={() =>
                          act("chess/start", {
                            mode: "lesson",
                            lessonId: next.id,
                          })
                        }
                      >
                        Next little lesson →
                      </button>
                    )}
                  </section>
                ) : (
                  <section className="chess-guide">
                    {scenario.guide.length > 0 && (
                      <>
                        <h2>{scenario.name}</h2>
                        <button
                          className="text-button"
                          onClick={() =>
                            speakParts(scenario.guide.map((p) => [p]))
                          }
                        >
                          🔊 Read endgame guide
                        </button>
                        {scenario.guide.map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </>
                    )}
                    <h2>🧠 Before every move</h2>
                    <ol>
                      <li>Is my king safe?</li>
                      <li>What did the other player threaten?</li>
                      <li>Are my pieces protected?</li>
                      <li>
                        If I am winning, does the other king still have a legal
                        move unless I give checkmate?
                      </li>
                    </ol>
                    <p>
                      To castle, tap your king, then g1 or c1 for White, g8 or
                      c8 for Black, when marked legal.
                    </p>
                  </section>
                )}
                <details className="chess-guide">
                  <summary>Moves & piece names</summary>
                  <p>
                    K king · Q queen · R rook · B bishop · N knight · Pawns have
                    no letter in move notation. + is check; # is checkmate; O-O
                    / O-O-O are castling.
                  </p>
                  <div className="chess-moves" aria-label="Move history">
                    {game.moves.length ? (
                      game.moves.map((m, i) => (
                        <span key={i}>
                          {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ""}
                          {m.san}
                        </span>
                      ))
                    ) : (
                      <p>No moves yet.</p>
                    )}
                  </div>
                </details>
              </aside>
            </div>
          </>
        )
      )}
      {openQuiz && (
        <ChessHelpQuiz
          key={openQuiz.id}
          game={game}
          busy={busy}
          onAct={act}
          onClose={() => act("chess/quiz-close", { quizId: openQuiz.id })}
        />
      )}
      {promotion && (
        <div className="chess-modal-backdrop">
          <section
            className="chess-promotion"
            ref={promotionDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chess-promotion-title"
          >
            <h2 id="chess-promotion-title">Choose your new piece</h2>
            <p>Your pawn reached the far edge.</p>
            <div>
              {["q", "r", "b", "n"]
                .filter((t) => promotion.choices.some((m) => m.promotion === t))
                .map((t) => (
                  <button
                    key={t}
                    disabled={busy}
                    onClick={() => {
                      act("chess/move", {
                        from: promotion.from,
                        to: promotion.to,
                        promotion: t,
                      });
                      setPromotion(null);
                    }}
                  >
                    <ChessPiece
                      piece={{ type: t, color: game.color }}
                      theme={pieces}
                    />
                    {PIECE_NAMES[t]}
                  </button>
                ))}
            </div>
            <button
              className="button secondary"
              onClick={() => setPromotion(null)}
            >
              Choose another move
            </button>
          </section>
        </div>
      )}
      <p className="chess-small-copy">
        <a href="/chess-license.txt">Chess rules & credits</a>
      </p>
    </main>
  );
}
