import { randomInt } from "node:crypto";
// Least-seen targets first, avoiding the preceding set when the pool allows it.
export function rotatePool(items, history, prompt) {
  const counts = new Map(),
    last = new Set(history.slice(-5));
  for (const p of history) counts.set(p, (counts.get(p) || 0) + 1);
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.sort(
    (a, b) =>
      Number(last.has(prompt(a))) - Number(last.has(prompt(b))) ||
      (counts.get(prompt(a)) || 0) - (counts.get(prompt(b)) || 0),
  );
}
