"use client";
import { useState } from "react";
import { api, ErrorBox } from "./ui";
export default function LearnerPicker({ data, parent = false }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function select(id) {
    if (busy || id === data.learnerId) return;
    setBusy(true);
    setError("");
    try {
      await api("learner/select", { id });
      if (!parent) window.location.hash = "home";
      window.location.reload();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <section
      className="learner-picker"
      aria-label={parent ? "Choose learner" : "Who's playing?"}
    >
      <p>{parent ? "Choose learner" : "Who’s playing?"}</p>
      <div>
        {data.learners.map((learner) => (
          <button
            key={learner.id}
            disabled={busy}
            aria-pressed={data.learnerId === learner.id}
            onClick={() => select(learner.id)}
          >
            <span aria-hidden="true">
              {learner.id === "oliver"
                ? "🦊"
                : learner.id === "test1"
                  ? "🧪"
                  : "🤖"}
            </span>
            <strong>{learner.name}</strong>
            {data.learnerId === learner.id && <span aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
      {data.learnerId !== "oliver" && (
        <p className="test-profile-note">
          Test profile · Stars and practice here stay separate from Oliver.
        </p>
      )}
      <ErrorBox message={error} />
    </section>
  );
}
