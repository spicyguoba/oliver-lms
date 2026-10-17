import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "../lib/store.mjs";
import { migrateFamily } from "../lib/migrations.mjs";
import { learnerData } from "../lib/learners.mjs";
import { reviewReward, rewardRequests } from "../lib/rewards.mjs";
import { learningCalendar } from "../lib/calendar.mjs";
const requestedAt = Date.parse("2026-10-16T18:00:00Z"),
  now = Date.parse("2026-10-17T15:00:00Z");
function request(d, status = "pending") {
  d.stars = 28;
  d.redemptions.push({
    id: "bedtime",
    rewardId: "choose-story",
    title: "Bedtime story",
    cost: 15,
    at: requestedAt,
    status,
  });
  return d.redemptions.at(-1);
}
test("schema six preserves old approval states and balances; never invents completion dates", () => {
  const d = seed();
  d.version = 5;
  for (const x of [d, ...Object.values(d.learners)]) request(x, "approved");
  const before = structuredClone(d);
  migrateFamily(d);
  assert.equal(d.version, 6);
  for (const id of ["oliver", "test1", "test2"]) {
    const x = learnerData(d, id),
      old = learnerData(before, id),
      r = x.redemptions[0];
    assert.equal(x.stars, 28);
    assert.equal(r.status, "approved");
    assert.equal(r.completedDay, null);
    assert.equal(r.completedAt, null);
    assert.equal(r.parentNote, "");
    const { parentNote, completedAt, completedDay, ...original } = r;
    assert.deepEqual(original, old.redemptions[0]);
  }
  const after = structuredClone(d);
  migrateFamily(d);
  assert.deepEqual(d, after);
});
test("complete a pending or approved reward without charging again; notes stay parent-only", () => {
  for (const status of ["pending", "approved"]) {
    const family = seed(),
      d = learnerData(family, "test1"),
      r = request(d, status);
    reviewReward(
      d,
      {
        id: r.id,
        action: "complete",
        completedDay: "2026-10-16",
        parentNote: "Read together. Oliver chose the book.",
      },
      now,
    );
    assert.equal(r.status, "completed");
    assert.equal(r.completedAt, now);
    assert.equal(r.completedDay, "2026-10-16");
    assert.equal(d.stars, 28);
    assert.equal(family.stars, 0);
    assert.equal(family.learners.test2.redemptions.length, 0);
    const after = structuredClone(r);
    reviewReward(
      d,
      {
        id: r.id,
        action: "complete",
        completedDay: "2026-10-17",
        parentNote: "Duplicate submission",
      },
      now + 1000,
    );
    reviewReward(d, { id: r.id, action: "refund" }, now + 2000);
    assert.deepEqual(r, after);
    assert.equal(d.stars, 28);
    assert.ok(!JSON.stringify(rewardRequests(d)).includes("Read together"));
    assert.ok(rewardRequests(d, true)[0].parentNote.includes("Read together"));
    const child = learningCalendar(d, "2026-10", now),
      parent = learningCalendar(d, "2026-10", now, true);
    assert.equal(child.days[0].stars, 0);
    assert.equal(child.days[0].qualifying, false);
    assert.equal(child.streak.current, 0);
    assert.equal(child.days[0].events[0].type, "reward");
    assert.ok(!JSON.stringify(child).includes("parentNote"));
    assert.equal(parent.days[0].events[0].parentNote, r.parentNote);
    reviewReward(
      d,
      { id: r.id, action: "note", parentNote: "Updated note" },
      now + 3000,
    );
    assert.equal(r.parentNote, "Updated note");
    assert.equal(r.completedAt, now);
    assert.equal(d.stars, 28);
  }
});
test("invalid dates/notes are rejected before mutation; concurrent-style refunds pay once", () => {
  const d = seed(),
    r = request(d);
  const before = structuredClone(r);
  for (const day of ["2026-02-30", "2026-10-18", "2026-10-15", "bad", {}])
    assert.throws(
      () =>
        reviewReward(
          d,
          { id: r.id, action: "complete", completedDay: day },
          now,
        ),
      /real completion date/,
    );
  for (const note of [{}, "x".repeat(1001)])
    assert.throws(
      () =>
        reviewReward(
          d,
          { id: r.id, action: "complete", parentNote: note },
          now,
        ),
      /1,000/,
    );
  assert.deepEqual(r, before);
  assert.equal(d.stars, 28);
  reviewReward(
    d,
    { id: r.id, action: "refund", parentNote: "Maybe another day" },
    now,
  );
  reviewReward(d, { id: r.id, action: "refund" }, now);
  assert.equal(d.stars, 43);
  assert.throws(
    () => reviewReward(d, { id: r.id, action: "complete" }, now),
    /refunded/,
  );
  assert.throws(
    () =>
      reviewReward(learnerData(d, "test2"), { id: r.id, action: "note" }, now),
    /not found/,
  );
});
