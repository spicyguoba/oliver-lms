"use client";
import { useEffect, useRef, useState } from "react";
import {
  speakParts,
  stopReading,
  questionSpeech,
} from "../public/read-along.js";
import { api, ErrorBox } from "./ui";
export default function ChessHelpQuiz({ game, busy, onAct, onClose }) {
  const q = game.quiz,
    [answer, setAnswer] = useState(""),
    [error, setError] = useState(""),
    dialog = useRef(null),
    timer = useRef({ start: 0, active: 0, losses: 0, helped: false });
  const question = q.question,
    finished = q.status !== "active";
  useEffect(() => {
    stopReading();
    setAnswer("");
    setError("");
    (
      dialog.current?.querySelector("h3") || dialog.current?.querySelector("h2")
    )?.focus();
    timer.current = {
      start: document.hidden ? 0 : performance.now(),
      active: 0,
      losses: 0,
      helped: false,
    };
  }, [question?.id]);
  useEffect(() => {
    const prior = document.activeElement;
    dialog.current?.querySelector("button")?.focus();
    function trap(e) {
      if (e.key !== "Tab") return;
      const items = [
          ...dialog.current.querySelectorAll(
            "button:not(:disabled),input:not(:disabled)",
          ),
        ],
        first = items[0],
        last = items.at(-1);
      if (!dialog.current.contains(document.activeElement)) {
        e.preventDefault();
        first?.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    function visibility() {
      const t = timer.current;
      if (document.hidden) {
        if (t.start) t.active += performance.now() - t.start;
        t.start = 0;
        t.losses++;
      } else t.start = performance.now();
    }
    document.addEventListener("keydown", trap);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("keydown", trap);
      document.removeEventListener("visibilitychange", visibility);
      stopReading();
      prior?.focus();
    };
  }, []);
  async function send(value) {
    if (busy) return;
    stopReading();
    const t = timer.current;
    await onAct("chess/quiz-answer", {
      quizId: q.id,
      questionId: question.id,
      answer: value,
      activeMs: Math.round(
        t.active + (t.start ? performance.now() - t.start : 0),
      ),
      focusLosses: t.losses,
      helped: t.helped,
    });
  }
  async function read() {
    const readingTimer = timer.current;
    const scope = dialog.current;
    try {
      await api("chess/quiz-read", {
        id: game.id,
        version: game.version,
        quizId: q.id,
      });
      if (!scope?.isConnected || timer.current !== readingTimer) return;
      timer.current.helped = true;
      speakParts(questionSpeech(question), scope);
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <div className="chess-modal-backdrop">
      <section
        ref={dialog}
        className="chess-help-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chess-quiz-title"
      >
        <div className="chess-modal-top">
          <span>
            📚 STUDY FOR A {q.action === "hint" ? "HINT" : "TAKE-BACK"}
          </span>
          <button disabled={busy} onClick={onClose}>
            Back to chess
          </button>
        </div>
        <h2 id="chess-quiz-title" tabIndex={-1}>
          {finished
            ? q.status === "passed"
              ? "Help unlocked!"
              : "Good practice. Try another quiz!"
            : `Little quiz · ${q.index + 1} of 3`}
        </h2>
        <p>
          {finished
            ? `${q.correct}/3 correct · +${q.earned} study stars`
            : "Answer all three. Get at least two right to earn this one action."}
        </p>
        <ErrorBox message={error} />
        {question && (
          <>
            <p className="chess-quiz-subject">
              {question.subject} · {question.skillTitle}
            </p>
            <h3 tabIndex={-1}>{question.prompt}</h3>
            {question.context && (
              <p
                className="chess-quiz-context"
                lang={question.language || "en"}
              >
                {question.context}
              </p>
            )}
            {!q.feedback && (
              <button className="text-button" disabled={busy} onClick={read}>
                🔊 Read question aloud
              </button>
            )}
            {question.options ? (
              <div className="chess-answer-options">
                {question.options.map((o, i) => (
                  <button
                    key={i}
                    className="button secondary"
                    disabled={busy || !!q.feedback}
                    onClick={() => send(String(i))}
                  >
                    {o}
                  </button>
                ))}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(answer);
                }}
              >
                <label>
                  Your answer
                  <input
                    autoComplete="off"
                    inputMode="decimal"
                    aria-label="Your answer"
                    value={answer}
                    disabled={busy || !!q.feedback}
                    onChange={(e) => setAnswer(e.target.value)}
                    maxLength={200}
                  />
                </label>
                {!q.feedback && (
                  <>
                    <div className="chess-number-pad">
                      {[
                        "1",
                        "2",
                        "3",
                        "4",
                        "5",
                        "6",
                        "7",
                        "8",
                        "9",
                        "0",
                        "/",
                        ".",
                      ].map((k) => (
                        <button
                          type="button"
                          key={k}
                          disabled={busy}
                          onClick={() =>
                            setAnswer((s) => (s + k).slice(0, 200))
                          }
                        >
                          {k}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setAnswer((s) => s.slice(0, -1))}
                      >
                        ⌫
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setAnswer("")}
                      >
                        Clear
                      </button>
                    </div>
                    <button
                      className="button"
                      disabled={busy || !answer.trim()}
                    >
                      Check answer
                    </button>
                  </>
                )}
              </form>
            )}
          </>
        )}
        {q.feedback && (
          <div className="chess-quiz-feedback" role="status">
            <strong>
              {q.feedback.correct ? "✓ You got it!" : "A clue for next time"}
            </strong>
            <p>Answer: {q.feedback.answer}</p>
            <p>{q.feedback.explanation}</p>
          </div>
        )}
        {q.status === "active" && q.feedback && (
          <button
            className="button"
            disabled={busy}
            onClick={() => onAct("chess/quiz-next", { quizId: q.id })}
          >
            Next question →
          </button>
        )}
        {finished && (
          <>
            <p>
              {q.status === "passed"
                ? q.action === "hint"
                  ? "Your hint is waiting beside the board."
                  : "Your last move and the computer’s reply have been taken back."
                : "Two correct answers unlock help. Your first answers stay recorded; a fresh quiz gives you another chance."}
            </p>
            {q.bonuses.map((b) => (
              <p key={b.kind}>
                +{b.stars} ★ {b.label}
              </p>
            ))}
            <button className="button" disabled={busy} onClick={onClose}>
              Back to my board →
            </button>
          </>
        )}
        {!finished && (
          <small>
            Finishing earns one star per correct answer. Leaving early saves
            your practice, with no star award.
          </small>
        )}
      </section>
    </div>
  );
}
