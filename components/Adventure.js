"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Home,
  CircleHelp,
  Volume2,
  ShieldCheck,
} from "lucide-react";
import { api, Brand, ErrorBox, Login, Loading } from "./ui";
import { speakParts } from "./WordLesson";
export default function Adventure({ id }) {
  const [session, setSession] = useState(null),
    [error, setError] = useState(""),
    [unauthorized, setUnauthorized] = useState(false),
    [busy, setBusy] = useState(false),
    [hint, setHint] = useState(""),
    [answer, setAnswer] = useState("");
  const timer = useRef({ start: 0, active: 0, losses: 0, helped: false });
  useEffect(() => {
    api("session/" + id)
      .then(setSession)
      .catch((e) =>
        e.status === 401 ? setUnauthorized(true) : setError(e.message),
      );
  }, [id]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  useEffect(() => {
    timer.current = {
      start: document.hidden ? null : performance.now(),
      active: 0,
      losses: 0,
      helped: false,
    };
    setHint("");
    setAnswer("");
    function visibility() {
      const t = timer.current;
      if (document.hidden) {
        if (t.start !== null) t.active += performance.now() - t.start;
        t.start = null;
        t.losses++;
      } else t.start = performance.now();
    }
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, [session?.question?.id]);
  async function mutate(endpoint, body) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const s = await api("session/" + id + "/" + endpoint, body);
      setSession(s);
      return s;
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(value) {
    const t = timer.current;
    await mutate("answer", {
      questionId: session.question.id,
      answer: value,
      activeMs: Math.round(
        t.active + (t.start === null ? 0 : performance.now() - t.start),
      ),
      focusLosses: t.losses,
      helped: t.helped,
    });
  }
  async function help() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const h = await api("session/" + id + "/hint", {});
      setHint(h.hint);
      timer.current.helped = true;
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function speak() {
    if (busy) return;
    setBusy(true);
    try {
      await api("session/" + id + "/hint", { kind: "read-aloud" });
      timer.current.helped = true;
      if (session.question.language) {
        const q = session.question;
        if (
          !speakParts([
            [q.prompt],
            [q.context, q.language === "zh" ? "zh-CN" : "en-US"],
            ...(q.options || []).flatMap((o, i) => [
              [`Choice ${i + 1}`],
              [o, q.optionsLanguage],
            ]),
          ])
        )
          setError(
            "Ask your grown-up to read with you. This browser has no read-aloud voice.",
          );
        return;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(
          (session.question.passage || "") +
            " " +
            session.question.prompt +
            ". " +
            (session.question.options || [])
              .map((o, i) => `Choice ${i + 1}. ${o}.`)
              .join(" "),
        );
        u.rate = 0.8;
        u.lang = "en-US";
        window.speechSynthesis.speak(u);
      } else
        setError(
          "Ask your grown-up to read this with you. This browser has no read-aloud voice.",
        );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (unauthorized) return <Login />;
  if (!session)
    return (
      <>
        <Loading />
        <ErrorBox message={error} />
      </>
    );
  const q = session.question;
  return (
    <main className="quiz-shell kid-quiz">
      <header className="quiz-header">
        <Brand />
        <a className="button secondary small" href="/">
          <Home size={22} /> Home
        </a>
      </header>
      <ErrorBox message={error} />
      {session.mode === "observed" && (
        <p className="quiz-info">
          <ShieldCheck size={15} /> Parent-observed round · work independently,
          with your grown-up nearby.
        </p>
      )}
      {session.finishedAt ? (
        <section className="quiz-card finish-card">
          <div className="big-icon">{session.correct >= 4 ? "🏆" : "🌱"}</div>
          <h1>You did it!</h1>
          <p>
            You answered {session.correct} of {session.total} correctly.
            <br />
            {session.correct >= 4
              ? "Look at those discoveries!"
              : "Your next try is another chance to learn."}
          </p>
          <div className="earned-stars">
            {"★".repeat(session.stars)}
            {"☆".repeat(Math.max(0, 5 - session.stars))}
          </div>
          <p>{session.stars} stars added to your collection.</p>
          {session.skill === "stories" && (
            <p>
              {session.correct >= 4
                ? "Story passed! Three different, consecutive passed stories unlock the next rank."
                : "A story passes at 4 of 5. This rank’s story streak starts again at zero."}
            </p>
          )}
          <a
            className="button"
            href={
              session.course
                ? "/#course-" + session.course
                : "/#world-" + (session.subject || "Math")
            }
          >
            Choose another game <ArrowRight size={22} />
          </a>
          <a className="button secondary" href="/">
            {" "}
            <Home size={22} /> Home
          </a>
        </section>
      ) : (
        <section className="quiz-card">
          <div className="quiz-count">
            <span>
              {session.icon} {session.title || "Let’s play"}
            </span>
            <span>
              {Math.min(session.index + 1, session.total)} / {session.total}
            </span>
          </div>
          <div className="quiz-progress">
            <div
              style={{ width: (session.index / session.total) * 100 + "%" }}
            />
          </div>
          <div
            className="kid-question-steps"
            aria-label={`Question ${Math.min(session.index + 1, session.total)} of ${session.total}`}
          >
            {Array.from({ length: session.total }, (_, i) => (
              <span
                key={i}
                className={
                  i < session.index
                    ? "done"
                    : i === session.index
                      ? "current"
                      : ""
                }
                aria-hidden="true"
              >
                {i + 1}
              </span>
            ))}
          </div>
          {q?.passage && (
            <div className="passage">
              <h2>{q.title}</h2>
              {q.passage}
            </div>
          )}
          {q && (
            <>
              <h1>{q.prompt}</h1>
              {q.context && (
                <div className="kid-quiz-context">
                  {q.vocabWord && (
                    <strong lang={q.language === "zh" ? "zh-CN" : "en"}>
                      {q.vocabWord}
                    </strong>
                  )}
                  {q.pronunciation && (
                    <p className="kid-pinyin">{q.pronunciation}</p>
                  )}
                  <p lang={q.language === "zh" ? "zh-CN" : "en"}>{q.context}</p>
                </div>
              )}
              {q.diagram && (
                <div
                  role="img"
                  aria-label={`${q.diagram.numerator} of ${q.diagram.denominator} equal pieces are shaded`}
                  className="fraction-visual"
                >
                  {Array.from({ length: q.diagram.denominator }, (_, i) => (
                    <span
                      key={i}
                      className={i < q.diagram.numerator ? "filled" : ""}
                    />
                  ))}
                </div>
              )}
              {q.options ? (
                <div className="question-options">
                  {q.options.map((o, i) => (
                    <button
                      key={i}
                      disabled={busy}
                      onClick={() => submit(String(i))}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              ) : (
                <form
                  className="numeric-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit(answer);
                  }}
                >
                  <input
                    aria-label="Your answer"
                    autoComplete="off"
                    inputMode={
                      ["fractions", "math-fractions-add"].includes(
                        session.skill,
                      )
                        ? "text"
                        : "decimal"
                    }
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={
                      ["fractions", "math-fractions-add"].includes(
                        session.skill,
                      )
                        ? "Like 1/2"
                        : "Your answer"
                    }
                    maxLength="40"
                    required
                  />
                  <button className="button" disabled={busy || !answer.trim()}>
                    Check my answer <ArrowRight size={18} />
                  </button>
                </form>
              )}
              {hint && (
                <div className="focus-message" role="status">
                  {hint}
                </div>
              )}
              <div className="quiz-actions">
                <button className="text-button" disabled={busy} onClick={help}>
                  <CircleHelp size={19} />
                  Show me how
                </button>
                {session.skill !== "chinese" && (
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={speak}
                  >
                    <Volume2 size={19} />
                    Read to me
                  </button>
                )}
                <button
                  className="text-button muted"
                  disabled={busy}
                  onClick={async () => {
                    const r = await mutate("leave", {});
                    if (r) window.location.href = "/";
                  }}
                >
                  Stop this game
                </button>
              </div>
            </>
          )}
          {session.feedback && (
            <div
              className={
                "feedback " + (session.feedback.correct ? "" : "try-again")
              }
              role="status"
            >
              <h2>
                {session.feedback.correct
                  ? "You found it! ✨"
                  : "Good try. Let’s work it out. 🌱"}
              </h2>
              <p>{session.feedback.explanation}</p>
              <button
                className="text-button"
                onClick={() => {
                  if (!("speechSynthesis" in window)) {
                    setError("Ask your grown-up to read this with you.");
                    return;
                  }
                  speakParts(
                    session.feedback.speech || [[session.feedback.explanation]],
                  );
                }}
              >
                <Volume2 size={22} /> Read this to me
              </button>
              <button
                className="button"
                disabled={busy}
                onClick={() => mutate("next", {})}
              >
                {session.index === session.total - 1 ? "See my stars" : "Next"}{" "}
                <ArrowRight size={19} />
              </button>
            </div>
          )}
        </section>
      )}
      <p className="quiz-info">
        No hurry. Think it through. It’s always okay to ask for help.
        <br />
        Your progress saves after every answer.
      </p>
    </main>
  );
}
