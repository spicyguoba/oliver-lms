"use client";
import {
  CHESS_LESSONS,
  CHESS_LEVELS,
  CHESS_SCENARIOS,
} from "../content/chess-lessons.mjs";
export default function ChessActivity({ history, timezone }) {
  if (!history) return null;
  return (
    <details className="section">
      <summary>
        Chess games & study quizzes ({history.games.length} boards ·{" "}
        {history.quizzes.length} quizzes)
      </summary>
      <p>
        Chess lessons and help quizzes are separate from five-question exercise
        benchmarks. Study quizzes need 2/3 correct to unlock one hint or undo.
        First answers, help and elapsed time are recorded below.
      </p>
      {!history.games.length && <p>No chess practice yet.</p>}
      {history.games.slice(0, 30).map((g) => (
        <div className="attempt" key={g.id}>
          <strong>
            {g.lessonId
              ? CHESS_LESSONS.find((l) => l.id === g.lessonId)?.title
              : `${CHESS_SCENARIOS[g.scenario || "standard"].name} · ${CHESS_LEVELS[g.difficulty - 1]?.name}`}{" "}
            · {g.outcome?.title || g.status.replaceAll("-", " ")}
          </strong>
          <p>
            {g.plies} turns currently recorded · {g.undoCount} earned take-backs
            · {g.earned} lesson stars
          </p>
          <small>
            {new Date(g.at).toLocaleString("en-US", { timeZone: timezone })}
          </small>
        </div>
      ))}
      {history.quizzes.map((q) => (
        <details key={q.id} className="attempt">
          <summary>
            {q.action} quiz · {q.attempts.filter((a) => a.correct).length}/3 ·{" "}
            {q.status} · {q.earned || 0} stars
          </summary>
          {q.attempts.map((a) => (
            <div key={a.questionId}>
              <strong>
                {a.correct ? "✓" : "↻"} {a.prompt}
              </strong>
              {a.context && <p>{a.context}</p>}
              <p>
                Answered: {a.answer} · Expected: {a.expected}
              </p>
              <small>
                {new Date(a.at).toLocaleString("en-US", { timeZone: timezone })}{" "}
                · {(a.wallMs / 1000).toFixed(1)} sec elapsed ·{" "}
                {(a.activeMs / 1000).toFixed(1)} sec active ·{" "}
                {a.helped ? "Help used" : "No help marked"} · {a.focusLosses}{" "}
                tab changes
              </small>
            </div>
          ))}
        </details>
      ))}
    </details>
  );
}
