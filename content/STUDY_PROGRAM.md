# Daily practice and learning calendar — edition 1

The family path supplies five suggestions per local day for 400 days, with continuing rotations after day 400. It starts on the family's first visit after the calendar upgrade. Missed days do not create overdue work. The daily selection is saved so reloads and multiple devices show the same plan.

Each day includes mathematics, English reading/words, Chinese, science, and alternating geography/history. English includes a weekly story round and a weekly phonics round. The existing story rank rule still applies. The discovery rotation includes world regions, Virginia, U.S. states, cultures, presidents, American history, prehistoric life, ancient civilizations, the Middle Ages, and Chinese dynasties.

The bank contains 2,000 English words and 1,200 Chinese words with meanings and contextual sentences, plus the existing phonics, stories, discovery questions and 18 procedural math activities. Games contain five questions. The 400-day audit actually generates 2,000 valid rounds / 10,000 question presentations across all six subjects. This does **not** mean 10,000 unique facts or 400 days of unique passages. Discovery facts, vocabulary and stories are intentionally revisited.

Vocabulary selects least-seen targets while avoiding the preceding set. A new twenty-word pack covers all targets in four rounds. Meaning and sentence activities are separate practice. Fixed discovery pools prefer different questions from the last set and then less-seen questions; pools of eight require some overlap between five-question rounds. Procedural math generates different number combinations, avoiding the previous set. Every round is saved on the server before the first answer and stays unchanged when resumed. Distractor order is not counted as a new problem.

Mathematics includes regrouping, fractions, multiplication/division, place value, rounding, money, time, perimeter, area, measurement, patterns, equivalent fractions, like-denominator addition and decimals. After day 120, a new day's math suggestion uses the stretch range only if at least twenty unhelped answers in the last six finished math rounds have 80% correct. Existing free-choice math level controls remain available. Word bands and this readiness rule are family practice guides, not validated grade levels; the topics include grade 3 concepts and extensions beyond it.

## Calendar and encouragement

- First answers are recorded on their actual local day. Partial/abandoned practice is visible but does not qualify for a streak or a finish bonus.
- Finishing a native club round at any score, or parent approval of a study quest, makes a learning day. The current streak remains visible through the day after the last completed day, so the child has today to continue it. A missed day resets the current run; best streak and earned stars remain.
- A qualifying day earns +2 stars once. Every seventh consecutive qualifying day adds +5. Finishing all five suggested games adds +5 once that day. Any native round with the matching skill, difficulty and completion day counts toward a suggestion, including free-choice and observed rounds. Starting a completed suggestion opens its saved result.
- Bonuses are server-owned ledger entries inside the completion/approval transaction. Duplicate next/approval requests and multiple devices cannot mint duplicates. Opening a calendar never awards stars.
- Historical learning appears immediately without retroactive bonuses. A late-approved quest is shown on its requested learning day; only approval of today's quest can trigger today's bonus. Previously earned milestones are never clawed back if a late review changes historical streak length.
- Calendar stars are gross awards, before spending. Native stars are attributed to completion day; new quest awards to learning day. Historical quest amounts that were never stored are labeled unknown rather than reconstructed from today's editable assignment value.
- Legacy game scores remain browser-reported, with their own stars separate. They are visible in the calendar but do not qualify for club streak bonuses or native independent metrics.
- Parent day details include first answers, mistakes, elapsed/active time, help and tab changes. Oliver receives only topics, round scores and awards. Timing is context and cannot detect calculators or diagnose ability.

All dates follow the family's configured timezone (currently America/New_York), including DST and leap days. Migration to schema 3 adds `learningProgram`, `dailyPlans`, and `consistencyAwards`; it does not replace saved questions, first answers, stars, source materials, quests, auth versions, legacy saves, or story unlocks.
