import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { seed } from "../lib/store.mjs";
import { learnerData } from "../lib/learners.mjs";
import { migrateFamily } from "../lib/migrations.mjs";
import { awardStars, starAwardHistory } from "../lib/star-awards.mjs";
import {
  dailyStarSummary,
  studyStarsByDay,
  streaks,
  awardConsistency,
  learningCalendar,
} from "../lib/calendar.mjs";
import {
  ROBUX_REWARD,
  requestReward,
  reviewReward,
  rewardShop,
} from "../lib/rewards.mjs";

const now = Date.parse("2026-10-24T16:00:00Z"),
  account = { id: "oliverparent", username: "oliverparent" };
const input = (extra = {}) => ({
  id: randomUUID(),
  title: "Brushed my teeth on my own",
  stars: 5,
  day: "2026-10-24",
  parentNote: "Private parent detail",
  ...extra,
});

test("schema ten only adds an empty award ledger and full Robux reward to each learner", () => {
  const data = seed();
  data.version = 9;
  for (const d of [data, ...Object.values(data.learners)]) {
    delete d.starAwards;
    d.rewards = d.rewards.filter((r) => r.id !== ROBUX_REWARD.id);
  }
  data.stars = 73;
  const before = structuredClone(data);
  migrateFamily(data, now);
  for (const id of ["oliver", "test1", "test2"]) {
    const d = learnerData(data, id),
      old = learnerData(before, id);
    assert.deepEqual(d.starAwards, []);
    assert.deepEqual(d.rewards, [...old.rewards, ROBUX_REWARD]);
    const { starAwards, rewards, learners, version, ...rest } =
      id === "oliver" ? data : data.learners[id];
    const {
      rewards: oldRewards,
      learners: oldLearners,
      version: oldVersion,
      ...oldRest
    } = id === "oliver" ? before : before.learners[id];
    assert.deepEqual(rest, oldRest);
  }
  const once = structuredClone(data);
  migrateFamily(data, now);
  assert.deepEqual(data, once);
});

test("awards are immutable, retry safe, learner scoped, private in child views, and counted on their chosen day", () => {
  const data = seed(),
    other = structuredClone(data.learners);
  const first = input();
  awardStars(data, first, account, now);
  assert.equal(awardStars(data, first, account, now).repeated, true);
  assert.equal(data.stars, 5);
  assert.equal(data.starAwards.length, 1);
  assert.throws(
    () => awardStars(data, { ...first, stars: 20 }, account, now),
    /different details/,
  );
  assert.deepEqual(data.learners, other);
  assert.equal(starAwardHistory(data)[0].parentNote, undefined);
  assert.equal(starAwardHistory(data)[0].awardedBy, undefined);
  assert.equal(starAwardHistory(data, true)[0].parentNote, first.parentNote);
  assert.equal(dailyStarSummary(data, now).todayStars, 5);
  assert.equal(studyStarsByDay(data).get(first.day), undefined);
  assert.equal(streaks(data, now).todayStars, 0);
  assert.deepEqual(awardConsistency(data, now), []);
  awardStars(data, input({ stars: 30, day: "2026-10-23" }), account, now);
  assert.equal(data.stars, 35);
  assert.equal(dailyStarSummary(data, now).todayStars, 5);
  const child = learningCalendar(data, "2026-10", now),
    parent = learningCalendar(data, "2026-10", now, true);
  const day = child.days.find((d) => d.day === first.day);
  assert.equal(day.parentStars, 5);
  assert.equal(day.studyStars, 0);
  assert.equal(day.qualifying, false);
  assert.ok(!JSON.stringify(child).includes(first.parentNote));
  assert.ok(JSON.stringify(parent).includes(first.parentNote));
});

test("invalid star amounts, reasons, dates and notes cannot mutate the wallet or ledger", () => {
  const data = seed(),
    before = structuredClone(data);
  for (const change of [
    { stars: 0 },
    { stars: -1 },
    { stars: 1.5 },
    { stars: true },
    { stars: Infinity },
    { stars: 100001 },
    { stars: "no" },
    { title: "  " },
    { title: "x".repeat(121) },
    { day: "2026-02-30" },
    { day: "2026-10-25" },
    { parentNote: {} },
    { parentNote: "x".repeat(1001) },
    { id: "oops" },
  ])
    assert.throws(() => awardStars(data, input(change), account, now));
  assert.deepEqual(data, before);
});

test("parent awards respect the family midnight and DST without resetting the wallet", () => {
  const data = seed();
  awardStars(
    data,
    input({ day: "2026-11-01" }),
    account,
    Date.parse("2026-11-02T04:59:59Z"),
  );
  assert.equal(
    dailyStarSummary(data, Date.parse("2026-11-02T04:59:59Z")).todayStars,
    5,
  );
  assert.equal(
    dailyStarSummary(data, Date.parse("2026-11-02T05:00:00Z")).todayStars,
    0,
  );
  assert.equal(data.stars, 5);
});

test("Robux costs exactly 5,000 stars and remains one indivisible package through request, approval and delivery", () => {
  const data = seed();
  data.stars = 4999;
  assert.throws(() => requestReward(data, ROBUX_REWARD.id, now), /collecting/);
  assert.equal(data.stars, 4999);
  assert.equal(data.redemptions.length, 0);
  data.stars = 10000;
  assert.throws(
    () => requestReward(data, ROBUX_REWARD.id, now, 100),
    /Partial/,
  );
  requestReward(data, ROBUX_REWARD.id, now);
  assert.equal(data.stars, 5000);
  const r = data.redemptions[0];
  assert.equal(r.quantity, 1000);
  assert.equal(r.cost, 5000);
  assert.throws(
    () => requestReward(data, ROBUX_REWARD.id, now),
    /already with/,
  );
  reviewReward(data, { id: r.id, action: "approve" }, now);
  assert.equal(
    rewardShop(data, now).find((r) => r.id === ROBUX_REWARD.id).available,
    false,
  );
  assert.throws(
    () =>
      reviewReward(data, { id: r.id, action: "complete", quantity: 100 }, now),
    /Partial delivery/,
  );
  assert.equal(r.status, "approved");
  reviewReward(data, { id: r.id, action: "complete", quantity: 1000 }, now);
  reviewReward(data, { id: r.id, action: "complete", quantity: 1000 }, now);
  assert.equal(data.stars, 5000);
  assert.equal(r.status, "completed");
  assert.equal(
    rewardShop(data, now).find((r) => r.id === ROBUX_REWARD.id).available,
    true,
  );
  assert.equal(dailyStarSummary(data, now).todayStars, 0);
  assert.equal(learnerData(data, "test1").starAwards.length, 0);
});

test("declined Robux requests refund the full reservation once", () => {
  const data = seed();
  data.stars = 5000;
  requestReward(data, ROBUX_REWARD.id, now);
  const r = data.redemptions[0];
  reviewReward(data, { id: r.id, action: "refund" }, now);
  reviewReward(data, { id: r.id, action: "refund" }, now);
  assert.equal(data.stars, 5000);
  assert.equal(r.status, "refunded");
  assert.throws(
    () => reviewReward(data, { id: r.id, action: "complete" }, now),
    /refunded/,
  );
  requestReward(data, ROBUX_REWARD.id, now);
  const next = data.redemptions.at(-1);
  reviewReward(data, { id: next.id, action: "approve" }, now);
  reviewReward(data, { id: next.id, action: "refund" }, now);
  reviewReward(data, { id: next.id, action: "refund" }, now);
  assert.equal(data.stars, 5000);
  assert.equal(next.status, "refunded");
});
