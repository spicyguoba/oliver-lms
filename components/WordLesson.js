"use client";
import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { api, ErrorBox, Loading } from "./ui";

import { speakParts, stopReading } from "../public/read-along.js";
export { speakParts } from "../public/read-along.js";
export default function WordLesson({ id }) {
  const [lesson, setLesson] = useState(null),
    [error, setError] = useState(""),
    [card, setCard] = useState(0);
  useEffect(() => {
    let active = true;
    api("lesson/" + id)
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
  }, [card]);
  if (error) return <ErrorBox message={error} />;
  if (!lesson) return <Loading />;
  const c = lesson.cards[card],
    chinese = lesson.language === "zh";
  function listen(event) {
    if (
      !speakParts(
        chinese
          ? [
              [c.word, "zh-CN"],
              [c.sentence, "zh-CN"],
            ]
          : [[c.word], [c.example]],
        event.currentTarget.closest(".kid-word-card"),
      )
    )
      setError(
        "Ask your grown-up to read with you. This browser has no read-aloud voice.",
      );
  }
  return (
    <section className="kid-word-lesson">
      <h2>Meet your words</h2>
      <p>Try the cards first. Listening here is learning time.</p>
      <div className="kid-word-card" aria-live="polite">
        <p>
          Word {card + 1} of {lesson.cards.length} · {lesson.band}
        </p>
        <h3 lang={chinese ? "zh-CN" : "en"}>{c.word}</h3>
        {c.pinyin && <p className="kid-pinyin">{c.pinyin}</p>}
        <p className="kid-word-meaning">{c.meaning}</p>
        <p className="kid-word-example" lang={chinese ? "zh-CN" : "en"}>
          {c.sentence || c.example}
        </p>
        {c.translation && <p className="kid-translation">{c.translation}</p>}
        <button className="kid-listen" onClick={listen}>
          <Volume2 size={23} /> Hear {chinese ? "Chinese" : "this word"}
        </button>
      </div>
      <div className="kid-card-controls">
        <button disabled={card === 0} onClick={() => setCard((n) => n - 1)}>
          ← Previous word
        </button>
        <button
          disabled={card === lesson.cards.length - 1}
          onClick={() => setCard((n) => n + 1)}
        >
          Next word →
        </button>
      </div>
      <details className="kid-more">
        <summary>For grown-ups: practice notes & credits</summary>
        <p>{lesson.note}</p>
        <p>{lesson.credits}</p>
        <p>{c.source}</p>
        <p>{c.attribution}</p>
        <p>
          Paths are practice suggestions, not age levels or standardized word
          rankings. Simplified Chinese and Mandarin pinyin are used. Some words
          have other meanings or pronunciations. Speech depends on voices
          installed on this device.
        </p>
      </details>
    </section>
  );
}
