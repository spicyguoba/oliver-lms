"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api, ErrorBox } from "./ui";
import { shiftDay } from "../lib/dates.mjs";

export function StreakTrail({ streak }) {
  const steps = streak.current ? ((streak.current - 1) % 7) + 1 : 0;
  return (
    <section className="streak-trail" aria-label="Learning streak">
      <div>
        <span aria-hidden="true">🌱</span>
        <div>
          <h2>
            {streak.current} day{streak.current === 1 ? "" : "s"} in a row
          </h2>
          <p>
            {streak.todayComplete
              ? "You showed up today. Well done!"
              : "One little game grows your learning trail."}
          </p>
        </div>
      </div>
      <ol aria-label={`${steps} of 7 days toward your next streak bonus`}>
        {Array.from({ length: 7 }, (_, i) => (
          <li
            key={i}
            className={i < steps ? "grown" : ""}
            aria-label={`Day ${i + 1}${i < steps ? ", complete" : ""}`}
          >
            {i < steps ? "★" : i + 1}
          </li>
        ))}
      </ol>
      <p>+2 ★ for a learning day · +5 ★ every 7 days in a row</p>
      <small>
        Best: {streak.best} day{streak.best === 1 ? "" : "s"} · A break is okay.
        Your stars stay yours.
      </small>
    </section>
  );
}
export function DailyFive({ plan, onPlay, busy = false }) {
  const completed = plan.slots.filter((s) => s.completed).length;
  return (
    <section className="daily-five" aria-labelledby="daily-five-title">
      <div className="daily-heading">
        <div>
          <p>YOUR LITTLE ADVENTURES</p>
          <h2 id="daily-five-title">Today’s five</h2>
        </div>
        <strong>{completed} / 5 done</strong>
      </div>
      <p>
        Pick one to start. Take breaks whenever you like. All five earns +5 ★!
      </p>
      <ol className="daily-games">
        {plan.slots.map((s, i) => (
          <li key={s.slot} className={s.completed ? "daily-done" : ""}>
            <span className="daily-number">{s.completed ? "✓" : i + 1}</span>
            <span className="daily-icon" aria-hidden="true">
              {s.icon}
            </span>
            <div>
              <small>
                {s.subject}
                {s.difficulty === 2 ? " · Stretch" : ""}
              </small>
              <h3>{s.title}</h3>
              {s.completed ? (
                <p>Finished today · {s.score}</p>
              ) : (
                <a href={`/#learn-${s.skill}`}>Meet this game first</a>
              )}
            </div>
            <button
              className="button"
              disabled={busy}
              onClick={() => onPlay(s.slot)}
              aria-label={`${s.completed ? "See result for" : s.sessionId ? "Continue" : "Play"} ${s.title}`}
            >
              {s.completed ? "★ Done" : s.sessionId ? "Continue" : "Play ▶"}
            </button>
          </li>
        ))}
      </ol>
      <small>
        Day {plan.number} · A 400-day path, then continued practice. Games
        revisit ideas with rotating questions.
      </small>
    </section>
  );
}
const monthTitle = (month) =>
  new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
export default function LearningCalendar({ today, parent = false }) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api(`calendar?month=${month}`)
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [month]);
  function move(amount) {
    const d = new Date(`${month}-15T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + amount);
    const next = d.toISOString().slice(0, 7);
    if (next < "2000-01" || next > "2200-12") return;
    setMonth(next);
    setSelected(next === today.slice(0, 7) ? today : next + "-01");
    setData(null);
    setError("");
  }
  const first = month + "-01",
    offset = new Date(first + "T12:00:00Z").getUTCDay();
  const dates = Array.from({ length: 31 }, (_, i) => shiftDay(first, i)).filter(
    (d) => d.startsWith(month),
  );
  const dayMap = new Map((data?.days || []).map((d) => [d.day, d]));
  const picked = dayMap.get(selected);
  const monthStars = (data?.days || []).reduce((n, d) => n + d.stars, 0);
  return (
    <div
      className={`learning-calendar ${parent ? "parent-calendar" : "child-calendar"}`}
    >
      <ErrorBox message={error} />
      {data && <StreakTrail streak={data.streak} />}
      <section className="calendar-card" aria-busy={!data && !error}>
        <p>Tap a day to see its games, topics, and stars below.</p>
        <div className="calendar-heading">
          <button onClick={() => move(-1)} aria-label="Previous month">
            <ChevronLeft />
          </button>
          <h2>{monthTitle(month)}</h2>
          <button onClick={() => move(1)} aria-label="Next month">
            <ChevronRight />
          </button>
        </div>
        <p>
          {data
            ? `${monthStars} ★ earned this month`
            : error
              ? "Calendar could not load."
              : "Growing your calendar…"}{" "}
          ·{" "}
          <button
            className="calendar-today"
            onClick={() => {
              setMonth(today.slice(0, 7));
              setSelected(today);
            }}
          >
            Today
          </button>
        </p>
        <div
          className="calendar-grid"
          role="group"
          aria-label={monthTitle(month)}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <span className="calendar-weekday" key={d}>
              {d}
            </span>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {dates.map((day) => {
            const d = dayMap.get(day);
            return (
              <button
                key={day}
                disabled={!data}
                aria-pressed={selected === day}
                aria-current={day === today ? "date" : undefined}
                aria-label={`${day}${d ? `, ${d.stars} stars, ${d.topics.join(", ")}${d.qualifying ? ", learning day" : ""}` : ", no recorded learning"}`}
                className={`calendar-day${d?.qualifying ? " learning-day" : ""}`}
                onClick={() => setSelected(day)}
              >
                <strong>{Number(day.slice(-2))}</strong>
                <small>{d ? `${d.stars} ★` : "·"}</small>
              </button>
            );
          })}
        </div>
        <p className="calendar-key">
          🌱 Green = learning day · ★ = stars earned, before spending
        </p>
      </section>
      {data && (
        <section className="calendar-detail" aria-live="polite">
          <h2>
            {new Date(selected + "T12:00:00Z").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
              timeZone: "UTC",
            })}
          </h2>
          {picked ? (
            <>
              <p className="calendar-day-total">
                {picked.stars} ★ earned
                {picked.bonusStars > 0
                  ? ` · ${picked.bonusStars} bonus stars`
                  : ""}
              </p>
              <p>{picked.topics.join(" · ")}</p>
              {picked.unknownQuestStars && (
                <p>
                  Older quest star amounts were not saved; only known awards are
                  included.
                </p>
              )}
              <ul className="calendar-events">
                {picked.events.map((e) => (
                  <li key={`${e.type}-${e.id}`}>
                    <div>
                      <strong>
                        {e.type === "bonus"
                          ? "🌟 "
                          : e.type === "quest"
                            ? "📘 "
                            : e.type === "legacy"
                              ? "🏰 "
                              : "🎮 "}
                        {e.title}
                      </strong>
                      <p>
                        {e.type === "game"
                          ? `${e.correct}/${e.total} first answers correct · round finished`
                          : e.type === "practice"
                            ? `${e.correct}/${e.total} first answers correct · practice recorded, no round finished this day`
                            : e.type === "legacy"
                              ? `${e.correct}/${e.total} reported score`
                              : e.type === "quest"
                                ? `Parent review: ${e.status}`
                                : "Consistency bonus"}
                        {e.stars ? ` · +${e.stars} ★` : ""}
                      </p>
                      {e.type === "legacy" && (
                        <small>
                          Game-reported · own game stars separate · no club
                          streak bonus
                        </small>
                      )}
                      {parent && e.at && (
                        <small>
                          {new Date(e.at).toLocaleTimeString("en-US", {
                            timeZone: data.timezone,
                            hour: "numeric",
                            minute: "2-digit",
                          })}{" "}
                          · {e.mode || e.type}
                        </small>
                      )}
                    </div>
                    {parent && e.attempts && (
                      <details>
                        <summary>First answers & timing</summary>
                        {e.attempts.map((a) => (
                          <div className="calendar-attempt" key={a.questionId}>
                            <strong>
                              {a.correct ? "✓" : "↻"} {a.prompt}
                            </strong>
                            <p>
                              Answered: {a.answer} · Expected: {a.expected}
                            </p>
                            <small>
                              {(a.wallMs / 1000).toFixed(1)} sec elapsed ·{" "}
                              {(a.activeMs / 1000).toFixed(1)} sec active ·{" "}
                              {a.helped ? "Help used" : "No help marked"} ·{" "}
                              {a.focusLosses} tab changes
                            </small>
                          </div>
                        ))}
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>
              {selected > today
                ? "Your next discoveries are waiting!"
                : "No learning recorded. Every new day is a fresh start."}
            </p>
          )}
        </section>
      )}
      {data && (
        <details className="calendar-rules">
          <summary>How learning days and bonus stars work</summary>
          <p>{data.rules}</p>
          <p>
            Days follow {data.timezone}. Completing a game celebrates practice;
            it does not establish mastery. The five games are suggestions, and
            you can choose other games too.
          </p>
          {parent && (
            <p>
              Times provide context, not proof of independent work or ability. A
              late-approved quest appears on its requested learning day; bonuses
              are only awarded for today's learning, without retroactive star
              payments.
            </p>
          )}
        </details>
      )}
    </div>
  );
}
