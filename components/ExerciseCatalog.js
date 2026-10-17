"use client";
import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { categoryProgress } from "../lib/progress.mjs";

export const courses = [
  {
    id: "en-words",
    subject: "Reading",
    title: "Word explorers",
    icon: "🔤",
    description: "2,000 words · learn what they mean",
  },
  {
    id: "en-usage",
    subject: "Reading",
    title: "Sentence builders",
    icon: "✏️",
    description: "Use those 2,000 words in sentences",
  },
  {
    id: "zh-words",
    subject: "Chinese",
    title: "Word garden",
    icon: "🌸",
    description: "1,200 words · characters and pinyin",
  },
  {
    id: "zh-usage",
    subject: "Chinese",
    title: "Sentence garden",
    icon: "🎋",
    description: "Use those 1,200 words in sentences",
  },
];
export function ProgressCount({ exercises, compact = false }) {
  const { total, completed, left } = categoryProgress(exercises);
  return (
    <div className={"kid-category-progress" + (compact ? " compact" : "")}>
      <span>
        <strong>{total}</strong> {total === 1 ? "exercise" : "exercises"} ·{" "}
        <strong>{completed}</strong> finished · <strong>{left}</strong> left
      </span>
      <span className="kid-category-track" aria-hidden="true">
        <i style={{ width: `${total ? (completed / total) * 100 : 0}%` }} />
      </span>
    </div>
  );
}
export function CompletionLabel({ completion, timezone = "America/New_York" }) {
  if (!completion) return <small className="kid-unplayed">Ready to try</small>;
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(completion.date));
  return (
    <div className="kid-last-completion">
      <strong>
        ✓ Finished · last score {completion.correct}/{completion.total}
      </strong>
      <time dateTime={new Date(completion.date).toISOString()}>{date}</time>
    </div>
  );
}
export function ExerciseCard({ exercise, timezone }) {
  return (
    <a
      className={"kid-topic" + (exercise.lastCompletion ? " kid-finished" : "")}
      href={"/#learn-" + exercise.id}
    >
      <span>{exercise.icon}</span>
      <div>
        <h2>{exercise.title}</h2>
        <p>{exercise.description}</p>
        <CompletionLabel
          completion={exercise.lastCompletion}
          timezone={timezone}
        />
      </div>
      <Play size={24} />
    </a>
  );
}
export function CourseCard({ course, exercises }) {
  return (
    <a className="kid-topic kid-course" href={"/#course-" + course.id}>
      <span>{course.icon}</span>
      <div>
        <h2>{course.title}</h2>
        <p>{course.description}</p>
        <ProgressCount exercises={exercises} />
      </div>
      <Play size={24} />
    </a>
  );
}
export function ExerciseCatalog({ exercises, timezone, vocabulary = false }) {
  const [band, setBand] = useState("All");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const result = useRef(null);
  function changePage(next) {
    setPage(next);
    result.current?.scrollIntoView({ block: "start" });
  }
  const matches = exercises.filter(
    (s) =>
      (band === "All" || s.band === band) &&
      (status === "All" ||
        (status === "Finished" ? !!s.lastCompletion : !s.lastCompletion)) &&
      `${s.title} ${s.keywords || s.description}`
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(matches.length / 12));
  const shownPage = Math.min(page, pages - 1);
  return (
    <>
      {vocabulary && (
        <p className="kid-subtitle">
          Start with 🌱 Starter. Learn twenty word cards, then play a
          five-question game. A finished game is one step along the way!
        </p>
      )}
      <ProgressCount exercises={exercises} />
      <div className="kid-catalog-tools">
        {vocabulary && (
          <label>
            Choose your path
            <select
              value={band}
              onChange={(e) => {
                setBand(e.target.value);
                setPage(0);
              }}
            >
              <option value="All">All paths</option>
              <option>Starter</option>
              <option>Growing</option>
              <option>Challenge</option>
            </select>
          </label>
        )}
        <label>
          Show games
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="All">All games</option>
            <option value="New">Still to try</option>
            <option>Finished</option>
          </select>
        </label>
        {vocabulary && (
          <label>
            Find a word
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder={
                exercises[0]?.language === "zh" ? "e.g. 学校" : "e.g. garden"
              }
              type="search"
            />
          </label>
        )}
      </div>
      <p className="kid-catalog-result" role="status" ref={result}>
        {matches.length
          ? `${shownPage * 12 + 1}–${Math.min(matches.length, (shownPage + 1) * 12)} of ${matches.length} games`
          : "No games here yet. Try another choice."}
      </p>
      <div className="kid-topic-grid">
        {matches.slice(shownPage * 12, shownPage * 12 + 12).map((s) => (
          <ExerciseCard key={s.id} exercise={s} timezone={timezone} />
        ))}
      </div>
      {pages > 1 && (
        <nav className="kid-card-controls" aria-label="Exercise pages">
          <button
            disabled={shownPage === 0}
            onClick={() => changePage(Math.max(0, shownPage - 1))}
          >
            ← Back a page
          </button>
          <span>
            Page {shownPage + 1} of {pages}
          </span>
          <button
            disabled={shownPage >= pages - 1}
            onClick={() => changePage(shownPage + 1)}
          >
            More games →
          </button>
        </nav>
      )}
    </>
  );
}
