import { localDay } from "./dates.mjs";

export const LEARNER_IDS = ["oliver", "test1", "test2"];
const privateFields = new Set([
  "profile",
  "stars",
  "sessions",
  "legacy",
  "legacyEvents",
  "legacyCompletions",
  "completions",
  "redemptions",
  "storyProgress",
  "learningProgram",
  "dailyPlans",
  "consistencyAwards",
  "assignments",
  "rewards",
  "dash",
  "chess",
]);
export function createLearner(name, family, now = Date.now()) {
  return {
    profile: { ...family.profile, name },
    stars: 0,
    sessions: [],
    legacy: {},
    legacyEvents: [],
    legacyCompletions: [],
    completions: [],
    redemptions: [],
    dash: { unlocked: 1, levels: {}, runs: [] },
    chess: {
      preferences: { board: "forest", pieces: "classic" },
      games: [],
      quizzes: [],
      lessons: {},
      completions: [],
    },
    assignments: structuredClone(family.assignments),
    rewards: structuredClone(family.rewards),
    storyProgress: Array.from({ length: 5 }, (_, i) => ({
      unlocked: i === 0,
      streak: [],
    })),
    learningProgram: {
      edition: 1,
      startDay: localDay(now, family.settings.timezone),
    },
    dailyPlans: {},
    consistencyAwards: [],
  };
}
export function validLearner(id) {
  return LEARNER_IDS.includes(id);
}
export function learnerList(family) {
  return LEARNER_IDS.map((id) => ({
    id,
    name: (id === "oliver" ? family : family.learners[id]).profile.name,
    isTest: id !== "oliver",
  }));
}
// Oliver's original fields stay in place. All learner-specific writes go through
// this transaction-local view; only family settings and source materials are shared.
export function learnerData(family, id = "oliver") {
  if (!validLearner(id)) throw new Error("Unknown learner.");
  const record = id === "oliver" ? family : family.learners[id];
  if (!record) throw new Error("Learner unavailable.");
  return new Proxy(family, {
    get(target, key) {
      if (key === "learnerId") return id;
      return privateFields.has(key) ? record[key] : target[key];
    },
    set(target, key, value) {
      if (key === "learnerId")
        throw new Error("Learner selection is session-owned.");
      (privateFields.has(key) ? record : target)[key] = value;
      return true;
    },
  });
}
