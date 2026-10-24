import { skills } from "./questions.mjs";
import { localDay, shiftDay } from "./dates.mjs";
import { dailyPlan } from "./planner.mjs";
import { parentStarsByDay } from "./star-awards.mjs";
import {
  CHESS_LESSONS,
  CHESS_LEVELS,
  CHESS_SCENARIOS,
} from "../content/chess-lessons.mjs";

export const STREAK_STAR_GOAL = 21;
// Gross earned stars, as shown on the learning calendar. The wallet is separate:
// purchases and refunds never change a day's learning/bonus earnings.
export function dailyStarSummary(data, now = Date.now()) {
  const today = localDay(now, data.settings.timezone);
  return {
    today,
    todayStars:
      (parentStarsByDay(data).get(today) || 0) +
      (studyStarsByDay(data).get(today) || 0) +
      data.consistencyAwards
        .filter((a) => a.day === today)
        .reduce((sum, a) => sum + a.stars, 0),
  };
}
export function studyStarsByDay(data) {
  const days = new Map();
  const add = (day, stars) =>
    days.set(day, (days.get(day) || 0) + Math.max(0, Number(stars) || 0));
  for (const s of data.sessions)
    if (s.finishedAt && !s.abandoned)
      add(localDay(s.finishedAt, data.settings.timezone), s.earned);
  for (const c of data.completions)
    if (c.status === "approved") add(c.day, c.earned);
  for (const run of data.dash?.runs || [])
    if (run.attempt)
      add(localDay(run.attempt.at, data.settings.timezone), run.earned);
  for (const q of data.chess?.quizzes || [])
    if (q.finishedAt && ["passed", "failed"].includes(q.status))
      add(localDay(q.finishedAt, data.settings.timezone), q.earned);
  for (const c of data.chess?.completions || [])
    add(localDay(c.at, data.settings.timezone), c.earned);
  return days;
}
export function qualifyingDays(data) {
  return new Set(
    [...studyStarsByDay(data)]
      .filter(([, stars]) => stars >= STREAK_STAR_GOAL)
      .map(([day]) => day),
  );
}
export function streaks(data, now = Date.now()) {
  const earned = studyStarsByDay(data),
    days = new Set(
      [...earned]
        .filter(([, stars]) => stars >= STREAK_STAR_GOAL)
        .map(([day]) => day),
    ),
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
    todayStars: earned.get(today) || 0,
    goalStars: STREAK_STAR_GOAL,
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
    award("practice", 2, "Daily star goal reached");
    if (streak.current % 7 === 0) award("week", 5, "Seven-day streak");
  }
  if (dailyPlan(data, now).slots.every((s) => s.completed))
    award("five", 5, "Today's five finished");
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
        parentStars: 0,
        unknownQuestStars: false,
        topics: [],
        events: [],
        qualifying: false,
      });
    return days.get(day);
  }
  function add(day, event) {
    const d = dayFor(day);
    if (!d) return;
    d.events.push(event);
    d.stars += event.stars || 0;
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
    add(localDay(s.finishedAt, data.settings.timezone), {
      id: s.id,
      type: "game",
      title: skills[s.skill]?.title || s.skill,
      topic: skills[s.skill]?.subject || "Practice",
      at: s.finishedAt,
      stars: s.earned || 0,
      correct: s.attempts.filter((a) => a.correct).length,
      total: s.questions.length,
      ...(admin ? { attempts: s.attempts, mode: s.mode } : {}),
    });
  }
  for (const c of data.completions) {
    const assignment = data.assignments.find((a) => a.id === c.assignmentId);
    add(c.day, {
      id: c.id,
      type: "quest",
      title: c.title || assignment?.title || "Study together",
      topic: "Study together",
      status: c.status,
      at: c.at,
      stars: c.status === "approved" ? (c.earned ?? null) : 0,
    });
    if (c.status === "approved" && c.earned == null) {
      const d = dayFor(c.day);
      if (d) d.unknownQuestStars = true;
    }
  }
  for (const r of data.dash?.runs || [])
    if (r.attempt)
      add(localDay(r.attempt.at, data.settings.timezone), {
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
      });
  for (const q of data.chess?.quizzes || []) {
    const complete = ["passed", "failed"].includes(q.status),
      day = complete ? localDay(q.finishedAt, data.settings.timezone) : null;
    const partial = new Map();
    for (const a of q.attempts) {
      const on = localDay(a.at, data.settings.timezone);
      if (on === day) continue;
      if (!partial.has(on)) partial.set(on, []);
      partial.get(on).push(a);
    }
    for (const [on, attempts] of partial)
      add(on, {
        id: `chess-quiz-${q.id}-${on}`,
        type: "practice",
        title: `Chess ${q.action} study quiz`,
        topic: [...new Set(attempts.map((a) => skills[a.skill]?.subject))]
          .filter(Boolean)
          .join(" · "),
        at: attempts.at(-1).at,
        stars: 0,
        correct: attempts.filter((a) => a.correct).length,
        total: attempts.length,
        ...(admin ? { attempts, mode: "chess help study quiz" } : {}),
      });
    if (complete)
      add(day, {
        id: `chess-quiz-${q.id}`,
        type: "game",
        title: `Chess ${q.action} study quiz`,
        topic: [...new Set(q.questions.map((x) => skills[x.skill]?.subject))]
          .filter(Boolean)
          .join(" · "),
        at: q.finishedAt,
        stars: q.earned,
        correct: q.attempts.filter((a) => a.correct).length,
        total: 3,
        ...(admin
          ? { attempts: q.attempts, mode: "chess help study quiz" }
          : {}),
      });
  }
  for (const c of data.chess?.completions || [])
    add(localDay(c.at, data.settings.timezone), {
      id: `chess-lesson-${c.id}`,
      type: "chess",
      title:
        CHESS_LESSONS.find((l) => l.id === c.lessonId)?.title || "Chess lesson",
      topic: "Chess",
      at: c.at,
      stars: c.earned,
      summary: "Chess lesson completed · first completion earns one star",
    });
  for (const g of data.chess?.games || [])
    for (const [i, f] of g.finishes.entries())
      add(localDay(f.at, data.settings.timezone), {
        id: `chess-game-${g.id}-${i}`,
        type: "chess",
        title: `Chess · ${CHESS_LEVELS[g.difficulty - 1]?.name || "Computer game"}`,
        topic: "Chess",
        at: f.at,
        stars: 0,
        summary: f.outcome.title,
      });
  for (const g of data.chess?.games || []) {
    const practice =
      g.mode === "computer"
        ? [...g.moves, ...g.undoEvents.flatMap((e) => e.removed)]
        : g.lessonAttempts.filter((a) => !a.success);
    const dates = new Map();
    for (const event of practice) {
      const day = localDay(event.at, data.settings.timezone);
      if (!dates.has(day)) dates.set(day, []);
      dates.get(day).push(event);
    }
    for (const [day, events] of dates)
      add(day, {
        id: `chess-practice-${g.id}-${day}`,
        type: "chess",
        title:
          g.mode === "computer"
            ? `Chess · ${CHESS_SCENARIOS[g.scenario || "standard"].name}`
            : CHESS_LESSONS.find((l) => l.id === g.lessonId)?.title,
        topic: "Chess",
        at: Math.max(...events.map((e) => e.at)),
        stars: 0,
        summary: `${events.length} chess ${g.mode === "computer" ? "turns practised" : "lesson tries"} · practice saved`,
      });
  }
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
  for (const r of data.redemptions)
    if (r.status === "completed" && r.completedDay)
      add(r.completedDay, {
        id: `reward-${r.id}`,
        type: "reward",
        title: r.title,
        stars: 0,
        cost: r.cost,
        at: r.completedAt,
        ...(admin ? { parentNote: r.parentNote } : {}),
      });
  for (const a of data.starAwards || []) {
    add(a.day, {
      id: a.id,
      type: "accomplishment",
      title: a.title,
      topic: "Everyday accomplishments",
      stars: a.stars,
      at: a.at,
      ...(admin ? { parentNote: a.parentNote, awardedBy: a.awardedBy } : {}),
    });
    const d = dayFor(a.day);
    if (d) d.parentStars += a.stars;
  }
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
  const studyStars = studyStarsByDay(data);
  for (const d of days.values()) {
    d.studyStars = studyStars.get(d.day) || 0;
    d.qualifying = d.studyStars >= STREAK_STAR_GOAL;
    d.events.sort((a, b) => a.at - b.at);
  }
  return {
    month,
    today,
    timezone: data.settings.timezone,
    streak: streaks(data, now),
    days: [...days.values()].sort((a, b) => a.day.localeCompare(b.day)),
    rules:
      "Earn at least 21 study stars in a day for it to count toward your streak. Stars from completed club games, Star Dash questions, completed chess study quizzes, first chess-lesson completions and parent-approved study quests count. Chess match results alone award no study stars. Bonus stars, parent-awarded everyday accomplishments and old favorites do not count toward the 21. Spending stars on rewards never reduces a day's progress. Reaching the goal earns +2 bonus stars once; every seventh streak day earns +5. Finishing all five daily games still earns +5 at any score. Breaks never remove earned stars. Older activity appears without retroactive bonuses. Quest stars are shown on their learning day.",
  };
}
