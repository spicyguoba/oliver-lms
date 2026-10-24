"use client";
import { useRef, useState } from "react";

const ideas = [
  ["🪥", "Brushed my teeth on my own"],
  ["🧼", "Washed my face on my own"],
  ["🧸", "Tidied up without a reminder"],
  ["💛", "Helped someone with kindness"],
];
const dateLabel = (day) =>
  new Date(day + "T12:00:00Z").toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function StarAwardList({ awards, parent = false }) {
  if (!awards.length)
    return (
      <p>Everyday wins will appear here when your grown-up awards stars.</p>
    );
  return (
    <ul className="star-award-history">
      {awards
        .slice()
        .reverse()
        .slice(0, parent ? 50 : 15)
        .map((a) => (
          <li key={a.id}>
            <div>
              <strong>🌟 {a.title}</strong>
              <p>
                {dateLabel(a.day)}
                {parent && a.awardedBy
                  ? ` · Awarded by ${a.awardedBy.username}`
                  : " · From your grown-up"}
              </p>
              {parent && a.parentNote && <p>Parent note: {a.parentNote}</p>}
            </div>
            <b>+{a.stars.toLocaleString()} ★</b>
          </li>
        ))}
    </ul>
  );
}

export default function StarAwards({ data, busy, onAward }) {
  const [title, setTitle] = useState(""),
    [stars, setStars] = useState("5"),
    [day, setDay] = useState(data.today),
    [note, setNote] = useState("");
  const requestId = useRef(null);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    requestId.current ||= crypto.randomUUID();
    const result = await onAward(
      "admin/star-award",
      {
        id: requestId.current,
        title,
        stars,
        day,
        parentNote: note,
      },
      `${stars} stars awarded to ${data.profile.name}!`,
    );
    if (result) {
      requestId.current = null;
      setTitle("");
      setNote("");
      setDay(data.today);
    }
  }
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">SMALL STEPS · BIG PRIDE</p>
        <h1>Celebrate everyday wins.</h1>
        <p>
          Award stars to {data.profile.name} for independence, kindness and
          effort.
        </p>
      </div>
      <section className="white-card star-award-panel">
        <h2>What went well?</h2>
        <div className="star-award-ideas">
          {ideas.map(([icon, text]) => (
            <button
              type="button"
              className="button secondary"
              key={text}
              disabled={busy}
              onClick={() => setTitle(text)}
            >
              <span aria-hidden="true">{icon}</span> {text}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="star-award-form">
          <label>
            Accomplishment
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Write your own everyday win"
              maxLength={120}
              required
            />
          </label>
          <div className="star-award-fields">
            <label>
              Stars to award
              <input
                name="stars"
                type="number"
                inputMode="numeric"
                min="1"
                max="100000"
                step="1"
                value={stars}
                onChange={(e) => setStars(e.target.value)}
                required
              />
            </label>
            <label>
              Accomplishment date
              <input
                name="day"
                type="date"
                min="2000-01-01"
                max={data.today}
                value={day}
                onChange={(e) => setDay(e.target.value)}
                required
              />
            </label>
          </div>
          <label>
            Private parent note (optional)
            <textarea
              name="parentNote"
              maxLength={1000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <p>
            The accomplishment and stars are visible to {data.profile.name}.
            Parent notes stay private. These spendable stars appear on the
            chosen calendar day; the learning streak uses its separate
            study-star goal.
          </p>
          <button className="button" disabled={busy || !title.trim()}>
            {busy
              ? "Saving…"
              : `Award ${Number(stars || 0).toLocaleString()} stars to ${data.profile.name}`}
          </button>
        </form>
      </section>
      <section className="white-card star-award-panel">
        <h2>Award history</h2>
        <p>{data.stars.toLocaleString()} stars available to spend.</p>
        <StarAwardList awards={data.starAwards} parent />
      </section>
    </>
  );
}
