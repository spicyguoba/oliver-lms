import { skills } from "./questions.mjs";
import { localDay, dayDistance } from "./dates.mjs";

export const PROGRAM_DAYS = 400;
const math = [
  "regrouping",
  "fractions",
  ...Object.keys(skills).filter((id) => id.startsWith("math-")),
];
const science = Object.keys(skills).filter(
  (id) => skills[id].subject === "Science",
);
const geography = Object.keys(skills).filter(
  (id) => skills[id].subject === "Geography",
);
const history = Object.keys(skills).filter((id) =>
  ["History", "People"].includes(skills[id].subject),
);
// Keep word-pack identities stable. Four separated visits cover each twenty-word pack.
function wordSlot(language, index) {
  const count = language === "en" ? 100 : 60;
  const cycle = Math.floor(index / count);
  const number = (index % count) + 1;
  const mode = cycle % 2 ? "usage" : "words";
  return `${language}-${mode}-${String(number).padStart(3, "0")}`;
}
export function scheduleDay(index) {
  const n = Math.max(0, Math.floor(index));
  return [
    math[n % math.length],
    n % 7 === 6 ? "stories" : n % 7 === 3 ? "phonics" : wordSlot("en", n),
    wordSlot("zh", n),
    science[n % science.length],
    n % 2
      ? history[Math.floor(n / 2) % history.length]
      : geography[Math.floor(n / 2) % geography.length],
  ];
}
function readyForStretch(data) {
  const attempts = data.sessions
    .filter(
      (s) =>
        !s.abandoned && s.finishedAt && skills[s.skill]?.subject === "Math",
    )
    .slice(-6)
    .flatMap((s) => s.attempts)
    .filter((a) => !a.helped);
  return (
    attempts.length >= 20 &&
    attempts.filter((a) => a.correct).length / attempts.length >= 0.8
  );
}
export function dailyPlan(data, now = Date.now()) {
  const day = localDay(now, data.settings.timezone);
  const index = Math.max(0, dayDistance(data.learningProgram.startDay, day));
  if (!data.dailyPlans[day]) {
    const stretch = index >= 120 && readyForStretch(data);
    data.dailyPlans[day] = {
      day,
      edition: 1,
      number: index + 1,
      slots: scheduleDay(index).map((skill, slot) => ({
        skill,
        difficulty:
          skill === "states"
            ? (Math.floor(index / 7) % 5) + 1
            : skills[skill].subject === "Math" && stretch
              ? 2
              : 1,
        slot,
      })),
    };
  }
  return planView(data, data.dailyPlans[day]);
}
export function planView(data, plan) {
  return {
    ...plan,
    programDays: PROGRAM_DAYS,
    slots: plan.slots.map((slot) => {
      const done = data.sessions.find(
        (s) =>
          s.skill === slot.skill &&
          s.difficulty === slot.difficulty &&
          s.finishedAt &&
          !s.abandoned &&
          localDay(s.finishedAt, data.settings.timezone) === plan.day,
      );
      const active = data.sessions.find(
        (s) =>
          s.skill === slot.skill &&
          s.difficulty === slot.difficulty &&
          !s.finishedAt &&
          s.mode === "practice",
      );
      return {
        ...slot,
        ...skills[slot.skill],
        id: slot.skill,
        completed: !!done,
        sessionId: done?.id || active?.id || null,
        score: done
          ? `${done.attempts.filter((a) => a.correct).length}/${done.questions.length}`
          : null,
      };
    }),
  };
}
