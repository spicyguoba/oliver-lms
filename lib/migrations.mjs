import { localDay } from "./dates.mjs";
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
  return data;
}
