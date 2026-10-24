import { localDay, validDay } from "./dates.mjs";

function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}

// Only call inside the learner's locked transaction, after manager authentication.
export function awardStars(data, input, account, now = Date.now()) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      input.id || "",
    )
  )
    fail("Reload the award form and try again.");
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const parentNote =
    typeof input.parentNote === "string" ? input.parentNote.trim() : "";
  const amount =
    typeof input.stars === "number" || typeof input.stars === "string"
      ? Number(input.stars)
      : NaN;
  const day = input.day || localDay(now, data.settings.timezone);
  if (!title || title.length > 120)
    fail("Describe the accomplishment in 1–120 characters.");
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100000)
    fail("Choose a whole number from 1 to 100,000 stars.");
  if (
    input.parentNote !== undefined &&
    (typeof input.parentNote !== "string" || input.parentNote.length > 1000)
  )
    fail("Parent notes can contain up to 1,000 characters.");
  if (!validDay(day) || day > localDay(now, data.settings.timezone))
    fail("Choose an accomplishment date up to today.");
  const existing = data.starAwards.find((a) => a.id === input.id);
  if (existing) {
    if (
      existing.title !== title ||
      existing.stars !== amount ||
      existing.day !== day ||
      existing.parentNote !== parentNote
    )
      fail(
        "This award was already saved with different details. Reload before continuing.",
        409,
      );
    return { ok: true, id: existing.id, repeated: true };
  }
  if (!Number.isSafeInteger(data.stars + amount))
    fail("The star balance is too large.");
  data.starAwards.push({
    id: input.id,
    title,
    stars: amount,
    day,
    at: now,
    parentNote,
    awardedBy: { id: account.id, username: account.username },
  });
  data.stars += amount;
  return { ok: true, id: input.id, repeated: false };
}

export function starAwardHistory(data, manager = false) {
  return data.starAwards.map((a) =>
    manager
      ? a
      : {
          id: a.id,
          title: a.title,
          stars: a.stars,
          day: a.day,
          at: a.at,
        },
  );
}

export function parentStarsByDay(data) {
  const days = new Map();
  for (const a of data.starAwards || [])
    days.set(a.day, (days.get(a.day) || 0) + a.stars);
  return days;
}
