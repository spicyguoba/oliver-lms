// Additive JSONB/file migration. Never recreate a learner or regenerate saved questions.
export function migrateFamily(data) {
  if ((data.version || 1) < 2) {
    data.legacyCompletions ||= [];
    data.version = 2;
  }
  return data;
}
