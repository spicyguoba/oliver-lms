export function completionOf(s) {
  if (!s?.finishedAt || s.abandoned) return null;
  return {
    date: s.finishedAt,
    correct: s.attempts.filter((a) => a.correct).length,
    total: s.questions.length,
  };
}
export function latestCompletion(sessions) {
  const s = sessions
    .filter((s) => s.finishedAt && !s.abandoned)
    .reduce(
      (best, s) => (!best || s.finishedAt > best.finishedAt ? s : best),
      null,
    );
  return completionOf(s);
}
export function categoryProgress(exercises) {
  const completed = exercises.filter((s) => s.lastCompletion).length;
  return {
    total: exercises.length,
    completed,
    left: exercises.length - completed,
  };
}
export function legacyProgress(data) {
  return Object.fromEntries(
    ["math", "reading", "stories"].map((game) => {
      const latest = (data.legacyCompletions || [])
        .filter((s) => s.game === game)
        .reduce((a, b) => (!a || b.date > a.date ? b : a), null);
      return [
        game,
        latest
          ? {
              date: latest.date,
              correct: latest.correct,
              total: latest.total,
              source: "legacy-client-reported",
            }
          : null,
      ];
    }),
  );
}
