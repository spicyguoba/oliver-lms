import { localDay } from "./dates.mjs";
import { createLearner } from "./learners.mjs";
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
  return data;
}
