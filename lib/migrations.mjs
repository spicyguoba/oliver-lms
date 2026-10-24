import { localDay } from "./dates.mjs";
import { createLearner } from "./learners.mjs";
import { initializeAccounts } from "./accounts.mjs";
import { ROBUX_REWARD } from "./rewards.mjs";
// Additive JSONB/file migration. Never recreate a learner or regenerate saved questions.
export function migrateFamily(data, now = Date.now()) {
  if ((data.version || 1) < 2) {
    data.legacyCompletions ||= [];
    data.version = 2;
  }
  if (data.version < 3) {
    data.learningProgram ||= {
      edition: 1,
      startDay: localDay(now, data.settings.timezone),
    };
    data.dailyPlans ||= {};
    data.consistencyAwards ||= [];
    data.version = 3;
  }
  if (data.version < 4) {
    data.learners ||= {};
    data.learners.test1 ||= createLearner("Test1", data, now);
    data.learners.test2 ||= createLearner("Test2", data, now);
    data.version = 4;
  }
  if (data.version < 5) {
    for (const learner of [data, data.learners.test1, data.learners.test2])
      learner.dash ||= { unlocked: 1, levels: {}, runs: [] };
    data.version = 5;
  }
  if (data.version < 6) {
    for (const learner of [data, data.learners.test1, data.learners.test2])
      for (const r of learner.redemptions) {
        r.parentNote ??= "";
        r.completedAt ??= null;
        r.completedDay ??= null;
      }
    data.version = 6;
  }
  if (data.version < 7) {
    initializeAccounts(data, now);
    data.version = 7;
  }
  if (data.version < 8) {
    for (const learner of [data, data.learners.test1, data.learners.test2])
      for (const reward of learner.rewards)
        reward.daily ??= ["choose-story", "family-game"].includes(reward.id);
    data.version = 8;
  }
  if (data.version < 9) {
    for (const learner of [data, data.learners.test1, data.learners.test2])
      learner.chess ||= {
        preferences: { board: "forest", pieces: "classic" },
        games: [],
        quizzes: [],
        lessons: {},
        completions: [],
      };
    data.version = 9;
  }
  if (data.version < 10) {
    for (const learner of [data, data.learners.test1, data.learners.test2]) {
      learner.starAwards ||= [];
      if (!learner.rewards.some((r) => r.id === ROBUX_REWARD.id))
        learner.rewards.push({ ...ROBUX_REWARD });
    }
    data.version = 10;
  }
  return data;
}
