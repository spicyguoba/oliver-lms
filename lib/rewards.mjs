import { localDay, validDay } from "./dates.mjs";
import { randomUUID } from "node:crypto";

export const ROBUX_REWARD = Object.freeze({
  id: "robux-1000",
  title: "1,000 Robux",
  cost: 5000,
  daily: false,
  kind: "robux",
  quantity: 1000,
  fullOnly: true,
});

function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
export function rewardShop(data, now = Date.now()) {
  const day = localDay(now, data.settings.timezone);
  return data.rewards.map((r) => {
    const requested = data.redemptions.some(
      (x) =>
        x.rewardId === r.id &&
        x.status !== "refunded" &&
        (r.daily
          ? localDay(x.at, data.settings.timezone) === day
          : x.status === "pending" || (r.fullOnly && x.status === "approved")),
    );
    return { ...r, available: !requested, refreshDay: r.daily ? day : null };
  });
}
// Called inside the same locked transaction as the wallet update.
export function requestReward(data, id, now = Date.now(), quantity) {
  const r = rewardShop(data, now).find((r) => r.id === id);
  if (!r) fail("Reward not found.");
  if (r.fullOnly && quantity !== undefined && quantity !== r.quantity)
    fail(
      "This reward is one complete 1,000-Robux package. Partial requests are not available.",
    );
  if (!r.available)
    fail(
      r.daily
        ? "You already chose this reward today. It refreshes tomorrow!"
        : "Your request is already with your grown-up.",
      409,
    );
  if (data.stars < r.cost) fail("Keep collecting stars for this reward.");
  data.stars -= r.cost;
  data.redemptions.push({
    id: randomUUID(),
    rewardId: r.id,
    title: r.title,
    cost: r.cost,
    status: "pending",
    at: now,
    parentNote: "",
    completedAt: null,
    completedDay: null,
    ...(r.fullOnly
      ? { kind: r.kind, quantity: r.quantity, fullOnly: true }
      : {}),
  });
  return { ok: true };
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
    ...(r.fullOnly
      ? { kind: r.kind, quantity: r.quantity, fullOnly: true }
      : {}),
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
    if (
      r.fullOnly &&
      input.quantity !== undefined &&
      input.quantity !== r.quantity
    )
      fail(
        "Deliver the complete 1,000-Robux reward before marking it completed. Partial delivery is not available.",
      );
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
    if (
      r.status !== "pending" &&
      !(r.fullOnly && r.status === "approved" && input.action === "refund")
    )
      return { ok: true };
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
