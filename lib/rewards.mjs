import { localDay, validDay } from "./dates.mjs";

function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
export function rewardRequests(data, admin = false) {
  if (admin) return data.redemptions;
  return data.redemptions.map((r) => ({
    id: r.id,
    rewardId: r.rewardId,
    title: r.title,
    cost: r.cost,
    status: r.status,
    at: r.at,
    completedAt: r.completedAt,
    completedDay: r.completedDay,
  }));
}
// Call within the family transaction. Stars were reserved when requested.
export function reviewReward(data, input, now = Date.now()) {
  const r = data.redemptions.find((r) => r.id === input.id);
  if (!r) fail("Reward request not found.", 404);
  if (!["approve", "refund", "complete", "note"].includes(input.action))
    fail("Choose a reward action.");
  if (
    input.parentNote !== undefined &&
    (typeof input.parentNote !== "string" || input.parentNote.length > 1000)
  )
    fail("Parent notes can contain up to 1,000 characters.");
  if (input.action === "complete") {
    if (r.status === "completed") return { ok: true };
    if (!["pending", "approved"].includes(r.status))
      fail("A refunded reward cannot be marked completed.", 409);
    const day = input.completedDay || localDay(now, data.settings.timezone);
    if (
      !validDay(day) ||
      day > localDay(now, data.settings.timezone) ||
      day < localDay(r.at, data.settings.timezone)
    )
      fail("Choose a real completion date between the request date and today.");
    r.status = "completed";
    r.reviewedAt ||= now;
    r.completedAt = now; // Recording time; completedDay is the parent's chosen date.
    r.completedDay = day;
  } else if (input.action === "approve" || input.action === "refund") {
    if (r.status !== "pending") return { ok: true };
    r.status = input.action === "approve" ? "approved" : "refunded";
    r.reviewedAt = now;
    if (input.action === "refund") data.stars += r.cost;
  }
  if (input.parentNote !== undefined && input.parentNote !== r.parentNote) {
    r.parentNote = input.parentNote;
    r.notesUpdatedAt = now;
  }
  return { ok: true };
}
