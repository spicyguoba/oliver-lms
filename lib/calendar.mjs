import { skills } from "./questions.mjs";
import { localDay, shiftDay } from "./dates.mjs";
import { dailyPlan } from "./planner.mjs";

export function qualifyingDays(data) {
  const days = new Set(
    data.sessions
      .filter((s) => s.finishedAt && !s.abandoned)
      .map((s) => localDay(s.finishedAt, data.settings.timezone)),
  );
  for (const c of data.completions)
    if (c.status === "approved") days.add(c.day);
  for (const run of data.dash?.runs || [])
    if (run.attempt) days.add(localDay(run.attempt.at, data.settings.timezone));
  return days;
}
export function streaks(data, now = Date.now()) {
  const days = qualifyingDays(data),
    today = localDay(now, data.settings.timezone);
  let day = days.has(today) ? today : shiftDay(today, -1),
    current = 0,
    best = 0,
    run = 0,
    previous;
  while (days.has(day)) {
    current++;
    day = shiftDay(day, -1);
  }
  for (const d of [...days].filter((d) => d <= today).sort()) {
    run = previous && shiftDay(previous, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    previous = d;
  }
  return {
    current,
    best,
    todayComplete: days.has(today),
    totalDays: days.size,
  };
}
// Called only inside the same transaction that completes a game or approves a quest.
// Reading the calendar never awards stars. Ledger keys make retries/multiple devices safe.
export function awardConsistency(data, now = Date.now()) {
  const day = localDay(now, data.settings.timezone),
    streak = streaks(data, now);
  const awarded = [];
  function award(kind, stars, label) {
    if (data.consistencyAwards.some((a) => a.day === day && a.kind === kind))
      return;
    const a = { day, kind, stars, label, at: now };
    data.consistencyAwards.push(a);
    data.stars += stars;
    awarded.push(a);
  }
  if (streak.todayComplete) {
    award("practice", 2, "Showing up today");
    if (streak.current % 7 === 0) award("week", 5, "Seven-day streak");
    if (dailyPlan(data, now).slots.every((s) => s.completed))
      award("five", 5, "Today's five finished");
  }
  return awarded;
}
export function learningCalendar(data, month, now = Date.now(), admin = false) {
  const today = localDay(now, data.settings.timezone),
    days = new Map();
  function dayFor(day) {
    if (!day.startsWith(month + "-")) return null;
    if (!days.has(day))
      days.set(day, {
        day,
        stars: 0,
        bonusStars: 0,
        unknownQuestStars: false,
        topics: [],
        events: [],
        qualifying: false,
      });
    return days.get(day);
  }
  function add(day, event, qualifies = false) {
    const d = dayFor(day);
    if (!d) return;
    d.events.push(event);
    d.stars += event.stars || 0;
    d.qualifying ||= qualifies;
    if (event.topic && !d.topics.includes(event.topic))
      d.topics.push(event.topic);
  }
  for (const s of data.sessions) {
    const finishedDay =
      s.finishedAt && !s.abandoned
        ? localDay(s.finishedAt, data.settings.timezone)
        : null;
    const practice = new Map();
    for (const a of s.attempts) {
      const day = localDay(a.at, data.settings.timezone);
      if (day === finishedDay) continue;
      if (!practice.has(day)) practice.set(day, []);
      practice.get(day).push(a);
    }
    for (const [day, attempts] of practice)
      add(day, {
        id: `${s.id}-${day}`,
        type: "practice",
        title: skills[s.skill]?.title || s.skill,
        topic: skills[s.skill]?.subject || "Practice",
        at: attempts.at(-1).at,
        stars: 0,
        correct: attempts.filter((a) => a.correct).length,
        total: attempts.length,
        ...(admin ? { attempts, mode: s.mode } : {}),
      });
    if (!s.finishedAt || s.abandoned) continue;
    add(
      localDay(s.finishedAt, data.settings.timezone),
      {
        id: s.id,
        type: "game",
        title: skills[s.skill]?.title || s.skill,
        topic: skills[s.skill]?.subject || "Practice",
        at: s.finishedAt,
        stars: s.earned || 0,
        correct: s.attempts.filter((a) => a.correct).length,
        total: s.questions.length,
        ...(admin ? { attempts: s.attempts, mode: s.mode } : {}),
      },
      true,
    );
  }
  for (const c of data.completions) {
    const assignment = data.assignments.find((a) => a.id === c.assignmentId);
    add(
      c.day,
      {
        id: c.id,
        type: "quest",
        title: c.title || assignment?.title || "Study together",
        topic: "Study together",
        status: c.status,
        at: c.at,
        stars: c.status === "approved" ? (c.earned ?? null) : 0,
      },
      c.status === "approved",
    );
    if (c.status === "approved" && c.earned == null) {
      const d = dayFor(c.day);
      if (d) d.unknownQuestStars = true;
    }
  }
  for (const r of data.dash?.runs || [])
    if (r.attempt)
      add(
        localDay(r.attempt.at, data.settings.timezone),
        {
          id: `dash-${r.id}`,
          type: "game",
          title: `Star Dash · Level ${r.level} · ${skills[r.skill]?.title || r.skill}`,
          topic: skills[r.skill]?.subject || "Practice",
          at: r.attempt.at,
          stars: r.earned || 0,
          correct: Number(r.attempt.correct),
          total: 1,
          ...(admin
            ? { attempts: [r.attempt], mode: "dash study question" }
            : {}),
        },
        true,
      );
  for (const c of data.legacyCompletions || [])
    add(localDay(c.date, data.settings.timezone), {
      id: c.id,
      type: "legacy",
      title: {
        math: "Math Quest",
        reading: "Reading Rangers",
        stories: "Story Star Adventures",
      }[c.game],
      topic: "Old favorites",
      at: c.date,
      correct: c.correct,
      total: c.total,
      stars: 0,
    });
  for (const a of data.consistencyAwards) {
    add(a.day, {
      id: `${a.day}-${a.kind}`,
      type: "bonus",
      title: a.label,
      stars: a.stars,
      at: a.at,
    });
    const d = dayFor(a.day);
    if (d) d.bonusStars += a.stars;
  }
  for (const d of days.values()) d.events.sort((a, b) => a.at - b.at);
  return {
    month,
    today,
    timezone: data.settings.timezone,
    streak: streaks(data, now),
    days: [...days.values()].sort((a, b) => a.day.localeCompare(b.day)),
    rules:
      "Finish one club game (any score) or a parent-approved study quest for a learning day. +2 stars once each day; +5 on every seventh day in a streak; +5 for all five daily games. Breaks never remove earned stars. Old favorites are game-reported and don't earn club streak bonuses. Older activity appears without retroactive bonuses. Quest stars are shown on the learning day.",
  };
}
