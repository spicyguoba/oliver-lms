"use client";
import { useEffect, useState } from "react";
import { api, ErrorBox } from "./ui";
import MapScene from "./MapScene";
import PersonPicture from "./PersonPicture";
import { speakParts, stopReading } from "../public/read-along.js";
export default function ExplorerLesson({ id }) {
  const [lesson, setLesson] = useState(null),
    [error, setError] = useState(""),
    [index, setIndex] = useState(0),
    [query, setQuery] = useState("");
  useEffect(() => {
    let active = true;
    api(`explore/${id}`)
      .then((d) => {
        if (active) setLesson(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
      stopReading();
    };
  }, [id]);
  useEffect(() => {
    stopReading();
  }, [index, query]);
  if (!lesson)
    return (
      <div role="status">
        Opening the discovery cards…
        <ErrorBox message={error} />
      </div>
    );
  const filtered = lesson.items.filter((p) =>
      `${p.name} ${p.fact}`.toLowerCase().includes(query.toLowerCase().trim()),
    ),
    person = lesson.subject === "People",
    current = filtered[Math.min(index, Math.max(0, filtered.length - 1))];
  return (
    <section className="explorer-lesson">
      <p className="eyebrow">LOOK • LISTEN • DISCOVER</p>
      <h2>{person ? "Meet the people first" : "Explore the map first"}</h2>
      {person ? (
        <p>
          Learn what people did and when they lived. Being famous does not mean
          every choice they made was right. Historical lives can be complicated.
          BCE means years before year 1; “about” means a date is uncertain.
        </p>
      ) : (
        <p>
          {lesson.map === "continents"
            ? "We use the seven-continent model. Australia is a continent; Oceania includes Australia and many Pacific islands. Europe and Asia share a landmass."
            : "Tap through the cards and look for the golden shape. A capital is where important government work happens; it may not be the biggest city."}
        </p>
      )}
      <label className="explorer-search">
        Find a {person ? "person" : "place"}
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          placeholder={person ? "Name or achievement" : "Place or fact"}
        />
      </label>
      {current ? (
        <>
          <div className="explorer-card-heading">
            <span>
              Card {Math.min(index + 1, filtered.length)} of {filtered.length}
            </span>
            <select
              aria-label={person ? "Choose a person" : "Choose a place"}
              value={current.id}
              onChange={(e) =>
                setIndex(filtered.findIndex((p) => p.id === e.target.value))
              }
            >
              {filtered.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div
            className={person ? "person-learning-card" : "place-learning-card"}
          >
            {person ? (
              <PersonPicture key={current.id} person={current} />
            ) : (
              <MapScene
                map={{ key: lesson.map, highlight: current.id, choices: [] }}
                caption={`${current.name} is highlighted in gold.`}
              />
            )}
            <div className="explorer-fact-card">
              <h3>{current.name}</h3>
              {current.dates && (
                <p className="person-dates">📅 {current.dates}</p>
              )}
              {current.capital && (
                <p>
                  <strong>🏛️ {current.capital}</strong>
                </p>
              )}
              <p>{current.fact}</p>
              <button
                className="button secondary"
                type="button"
                onClick={(event) =>
                  speakParts(
                    [
                      [current.name],
                      [current.dates],
                      [current.capital && "Capital:", "en-US", false],
                      [current.capital],
                      [current.fact],
                    ],
                    event.currentTarget.closest(".explorer-fact-card"),
                  )
                }
              >
                🔊 Read this card
              </button>
              <details>
                <summary>Learning sources</summary>
                <a
                  href={current.source || "https://www.naturalearthdata.com/"}
                  target="_blank"
                  rel="noreferrer"
                >
                  Read the reference
                </a>
                {current.dateSource && (
                  <p>
                    <a
                      href={current.dateSource}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Life-date data
                    </a>
                  </p>
                )}
              </details>
            </div>
          </div>
          <div className="explorer-card-nav">
            <button
              type="button"
              disabled={index <= 0}
              onClick={() => setIndex((i) => i - 1)}
            >
              ← Previous card
            </button>
            <button
              type="button"
              disabled={index >= filtered.length - 1}
              onClick={() => setIndex((i) => i + 1)}
            >
              Next card →
            </button>
          </div>
        </>
      ) : (
        <p role="status">No cards match. Try another search.</p>
      )}
      <p className="explorer-ready">
        Ready? Play five questions below to collect stars. Cards are untimed
        practice.
      </p>
    </section>
  );
}
