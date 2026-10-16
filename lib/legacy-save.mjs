// The child can write these saves. Keep data used by the old games' innerHTML
// numeric/boolean, even if a crafted save is posted directly to the API.
const number = (v, max = 1e9) =>
  Number.isFinite(Number(v))
    ? Math.min(max, Math.max(0, Math.trunc(Number(v))))
    : 0;
const record = (value, keyPattern, max, boolean = false) =>
  Object.fromEntries(
    Object.entries(value && typeof value === "object" ? value : {})
      .filter(([k]) => keyPattern.test(k))
      .map(([k, v]) => [k, boolean ? v === true : number(v, max)]),
  );
const ids = (value) =>
  Array.isArray(value)
    ? value.filter((n) => Number.isInteger(n) && n >= 0 && n < 20)
    : [];
export function sanitizeLegacySave(game, key, value) {
  try {
    const d = JSON.parse(value),
      trail = /^[0-5]-[0-2]$/;
    if (game === "math" && key === "mathquest-v1")
      return JSON.stringify({
        stars: number(d.stars),
        unlocked: record(d.unlocked, trail, 1, true),
        best: record(d.best, trail, 3),
      });
    if (game === "reading" && key === "reading-rangers-v1")
      return JSON.stringify({
        stars: number(d.stars),
        best: record(d.best, trail, 5),
        attempts: record(d.attempts, trail, 1e9),
        errors: record(d.errors, /^[0-5]$/, 1e9),
        unlocked: record(d.unlocked, trail, 1, true),
      });
    if (game === "stories" && key === "story-star-adventures-v1")
      return JSON.stringify({
        stars: number(d.stars),
        best: record(d.best, /^(?:[0-9]|1[0-9])$/, 3),
        levels: Array.from({ length: 5 }, (_, i) => {
          const l = d.levels?.[i] || {};
          return {
            streak: ids(l.streak).slice(-3),
            history: ids(l.history).slice(-5),
            attempts: number(l.attempts),
            successes: number(l.successes),
            unlocked: i === 0 || l.unlocked === true,
          };
        }),
      });
    if (game === "math" && key === "mathquest-session-v2") {
      if (d === null) return "null";
      if (
        !Array.isArray(d.questions) ||
        d.questions.length !== 8 ||
        d.questions.some(
          (q) =>
            !q ||
            typeof q.display !== "string" ||
            typeof q.tip !== "string" ||
            typeof q.ans !== "number" ||
            !Number.isFinite(q.ans),
        )
      )
        return null;
      return JSON.stringify({
        area: number(d.area, 5),
        level: number(d.level, 2),
        round: number(d.round, 8),
        correct: number(d.correct, 8),
        answered: d.answered === true,
        questions: d.questions.map((q) => ({
          display: q.display.slice(0, 250),
          tip: q.tip.slice(0, 500),
          ans: q.ans,
        })),
      });
    }
    if (
      (game === "math" && /^mathquest-last-[0-5]-[0-2]$/.test(key)) ||
      (game === "reading" && /^rr-previous-[0-5]-[0-2]$/.test(key))
    )
      return Array.isArray(d)
        ? JSON.stringify(
            d
              .filter((v) => typeof v === "string")
              .slice(0, 100)
              .map((v) => v.slice(0, 500)),
          )
        : null;
  } catch {}
  return null;
}
export function sanitizeLegacyMap(game, saved) {
  const clean = {};
  for (const [key, value] of Object.entries(saved || {})) {
    if (typeof value !== "string" || value.length > 100000) continue;
    const v = sanitizeLegacySave(game, key, value);
    if (v !== null) clean[key] = v;
  }
  return clean;
}
