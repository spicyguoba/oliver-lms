"use client";
import { useEffect, useRef, useState } from "react";
import { api, ErrorBox, Loading, Login } from "./ui";
import { DASH_LEVELS, dashLevel } from "../lib/dash-engine.mjs";
import DashCanvas from "./DashCanvas";
import { speakParts } from "./WordLesson";
import { createDashAudio } from "../lib/dash-audio.mjs";

export default function StarDash() {
  const [data, setData] = useState(null),
    [run, setRun] = useState(null),
    [error, setError] = useState(""),
    [unauthorized, setUnauthorized] = useState(false),
    [busy, setBusy] = useState(false),
    [answer, setAnswer] = useState(""),
    [music, setMusic] = useState(true),
    [sfx, setSfx] = useState(true);
  const timer = useRef({ start: 0, active: 0, losses: 0, helped: false }),
    feedbackAudio = useRef(null);
  async function load() {
    const d = await api("dash");
    setData(d);
    return d;
  }
  useEffect(() => {
    let active = true;
    api("dash")
      .then((d) => {
        if (active) {
          setData(d);
          setRun(d.pending);
        }
      })
      .catch((e) => {
        if (active)
          e.status === 401 ? setUnauthorized(true) : setError(e.message);
      });
    try {
      const saved = JSON.parse(localStorage.getItem("lms-dash-audio-v1"));
      if (saved) {
        setMusic(saved.music !== false);
        setSfx(saved.sfx !== false);
      }
    } catch {}
    return () => {
      active = false;
      feedbackAudio.current?.close();
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("lms-dash-audio-v1", JSON.stringify({ music, sfx }));
    } catch {}
  }, [music, sfx]);
  useEffect(() => {
    setAnswer("");
    timer.current = {
      start: document.hidden ? 0 : performance.now(),
      active: 0,
      losses: 0,
      helped: false,
    };
    function visibility() {
      const t = timer.current;
      if (document.hidden) {
        if (t.start) t.active += Math.max(0, performance.now() - t.start);
        t.start = 0;
        t.losses++;
      } else t.start = performance.now();
    }
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, [run?.question?.id]);
  async function start(level) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await api("dash/start", { level });
      setRun(r);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function finish(jumps) {
    setError("");
    try {
      const r = await api("dash/finish", { id: run.id, jumps });
      setRun(r);
      await load();
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }
  async function submit(value) {
    window.speechSynthesis?.cancel();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const t = timer.current;
      const r = await api("dash/answer", {
        id: run.id,
        questionId: run.question.id,
        answer: value,
        activeMs: Math.round(
          t.active + (t.start ? performance.now() - t.start : 0),
        ),
        focusLosses: t.losses,
        helped: t.helped,
      });
      setRun(r);
      feedbackAudio.current ||= createDashAudio();
      feedbackAudio.current.setSfx(sfx);
      feedbackAudio.current.effect(r.feedback.correct ? "correct" : "wrong");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function read() {
    if (busy) return;
    setBusy(true);
    try {
      await api("dash/hint", { id: run.id });
      timer.current.helped = true;
      const q = run.question;
      speakParts([
        [q.prompt],
        [q.context, q.language === "zh" ? "zh-CN" : "en-US"],
        ...(q.options || []).map((o, i) => [
          `${i + 1}. ${o}`,
          q.optionsLanguage || "en-US",
        ]),
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (unauthorized) return <Login />;
  if (!data)
    return (
      <main className="quiz-shell">
        <Loading />
        <ErrorBox message={error} />
        <a href="/">Adventure home</a>
      </main>
    );
  const config = run ? dashLevel(run.level) : null,
    q = run?.question;
  const earned = Object.keys(data.levels).filter(
    (n) => data.levels[n].starredAt,
  ).length;
  return (
    <main
      className="dash-shell"
      style={config ? { "--dash-accent": config.accent } : undefined}
    >
      <header className="dash-top">
        <a href="/#games">← Adventure home</a>
        <strong>✦ STAR DASH</strong>
        <span>
          {data.learnerName} · ★ {data.stars}
        </span>
      </header>
      <div className="dash-intro">
        <p className="dash-eyebrow">JUMP. DISCOVER. SHINE.</p>
        <h1>
          {config
            ? `${config.icon} ${config.title}`
            : "Twenty worlds. One brave little cube."}
        </h1>
        <p>
          {config
            ? `Level ${run.level} of 20 · ${run.level === 20 ? "The ultimate challenge · 3 study stars" : "1 study star"}`
            : "An original rhythm runner. Clear a course, then answer a question from your study games."}
        </p>
      </div>
      <div className="dash-toolbar">
        <button aria-pressed={music} onClick={() => setMusic((v) => !v)}>
          ♫ Music {music ? "on" : "off"}
        </button>
        <button aria-pressed={sfx} onClick={() => setSfx((v) => !v)}>
          ♪ Effects {sfx ? "on" : "off"}
        </button>
        {run && (
          <button
            onClick={() => {
              setRun(null);
              setError("");
              window.speechSynthesis?.cancel();
            }}
          >
            ▦ Level map
          </button>
        )}
        <span>{earned}/20 levels starred</span>
      </div>
      <ErrorBox message={error} />
      {run?.status === "running" && (
        <DashCanvas
          key={run.id}
          run={run}
          music={music}
          sfx={sfx}
          onClear={finish}
        />
      )}
      {q && (
        <section className="dash-study" aria-labelledby="dash-question-title">
          <span className="dash-study-icon">📚</span>
          <p>COURSE CLEARED · STUDY STAR TIME</p>
          <h2 id="dash-question-title">One little question</h2>
          <p>
            {run.subject} · {run.skillTitle}
          </p>
          <p>
            Answer correctly for {config.reward} ★
            {data.levels[run.level]?.starredAt
              ? " · This level’s study stars are already collected. Practice again for fun!"
              : ""}
          </p>
          {q.context && (
            <blockquote lang={q.language === "zh" ? "zh-CN" : undefined}>
              {q.context}
            </blockquote>
          )}
          <h3>{q.prompt}</h3>
          {q.pronunciation && <p>{q.pronunciation}</p>}
          <button className="button secondary" onClick={read} disabled={busy}>
            🔊 Read to me
          </button>
          {q.options ? (
            <div className="dash-options">
              {q.options.map((o, i) => (
                <button
                  key={i}
                  disabled={busy}
                  onClick={() => submit(String(i))}
                  lang={q.optionsLanguage}
                >
                  {o}
                </button>
              ))}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(answer);
              }}
            >
              <label>
                Your answer
                <input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  inputMode="decimal"
                  autoComplete="off"
                  maxLength={200}
                />
              </label>
              <div className="dash-keypad" aria-label="Answer keypad">
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
                  "/",
                  "0",
                  ".",
                ].map((key) => (
                  <button
                    type="button"
                    key={key}
                    disabled={busy}
                    onClick={() => setAnswer((a) => (a + key).slice(0, 200))}
                  >
                    {key}
                  </button>
                ))}
                <button
                  type="button"
                  className="dash-erase"
                  disabled={busy}
                  onClick={() => setAnswer((a) => a.slice(0, -1))}
                >
                  ⌫ Delete
                </button>
              </div>
              <button className="dash-action" disabled={busy || !answer.trim()}>
                Check my answer
              </button>
            </form>
          )}
        </section>
      )}
      {run?.feedback && (
        <section className="dash-study dash-result" role="status">
          <span className="dash-study-icon">
            {run.feedback.correct ? "🌟" : "🌱"}
          </span>
          <h2>
            {run.feedback.correct
              ? run.feedback.stars
                ? `+${run.feedback.stars} study star${run.feedback.stars === 1 ? "" : "s"}!`
                : "You found it!"
              : "Good try. Here’s the discovery."}
          </h2>
          <p>{run.feedback.explanation}</p>
          <p>
            {run.feedback.correct && !run.feedback.stars
              ? "You already collected this level’s stars. Your practice still counts."
              : !run.feedback.correct
                ? "Your first answer is saved. Replay this level for a fresh question and another star chance."
                : run.level === 20
                  ? "You conquered the final course and its study question!"
                  : "Your next world is unlocked!"}
          </p>
          {run.feedback.bonuses.map((b) => (
            <p key={b.kind}>
              🌱 {b.label}: +{b.stars} bonus stars
            </p>
          ))}
          <div className="dash-result-actions">
            {run.level < 20 && (
              <button
                className="dash-action"
                disabled={busy}
                onClick={() => start(run.level + 1)}
              >
                Next world →
              </button>
            )}
            <button disabled={busy} onClick={() => start(run.level)}>
              Replay level
            </button>
            <button onClick={() => setRun(null)}>Level map</button>
            <a href="/#calendar">My learning calendar</a>
          </div>
        </section>
      )}
      {!run && (
        <>
          <div className="dash-map-intro">
            <strong>
              ★ Collect a study star in each world. Level 20 gives three.
            </strong>
            <p>
              Clearing a course unlocks the next world, even if the study
              question needs another try. Stars are earned once per level.
              Replay any unlocked world.
            </p>
          </div>
          {data.pending && (
            <button
              className="dash-action"
              onClick={() => setRun(data.pending)}
            >
              📚 Finish your saved level {data.pending.level} question
            </button>
          )}
          <ol className="dash-map">
            {DASH_LEVELS.map((l) => {
              const p = data.levels[l.level],
                locked = l.level > data.unlocked;
              return (
                <li key={l.level}>
                  <button
                    className={p?.starredAt ? "dash-map-starred" : ""}
                    disabled={locked || busy}
                    style={{
                      "--tile-sky": l.sky,
                      "--tile-glow": l.horizon,
                      "--tile-accent": l.accent,
                    }}
                    onClick={() => start(l.level)}
                  >
                    <span className="dash-map-number">
                      {String(l.level).padStart(2, "0")}
                    </span>
                    <span className="dash-map-icon">
                      {locked ? "🔒" : l.icon}
                    </span>
                    <strong>{l.title}</strong>
                    <small>
                      {p?.starredAt
                        ? `✓ ${l.reward} ★ collected`
                        : p?.clears
                          ? "Course cleared · study star waiting"
                          : locked
                            ? "Clear the previous course"
                            : l.level === 20
                              ? "EXTREME · 3 ★"
                              : "Jump in · 1 ★"}
                    </small>
                    {p?.lastAnsweredAt && (
                      <small>
                        Last: {p.lastCorrect ? "1/1" : "0/1"} ·{" "}
                        {new Date(p.lastAnsweredAt).toLocaleDateString(
                          "en-US",
                          {
                            timeZone: data.timezone,
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </small>
                    )}
                    <span
                      className="dash-difficulty"
                      aria-label={`Challenge ${l.level} of 20`}
                    >
                      {Array.from({ length: 5 }, (_, i) => (
                        <i
                          key={i}
                          className={i < Math.ceil(l.level / 4) ? "lit" : ""}
                        />
                      ))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="dash-hint">
            Tap or hold to jump. Keyboard: Space / ↑. Pause anytime. Music and
            effects are original generated sounds; switch either off above.
            Level 20 is deliberately very difficult.
          </p>
        </>
      )}
    </main>
  );
}
