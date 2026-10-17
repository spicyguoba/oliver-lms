# Adventure Club handoff

## Learning calendar and daily-five path (2026-10-17)

Schema 3 adds a versioned learning-program start day, saved daily plans and an idempotent consistency-award ledger. Migration leaves all prior data in place and does not back-pay bonuses. Both roles can use `/api/calendar?month=YYYY-MM`; only admin receives first-answer/timing details. Finished rounds qualify on completion day; partial practice appears on each answer's actual local day. Approved quests qualify on requested learning day; older unsaved quest award amounts are explicitly unknown. Legacy scores remain separately labeled and do not qualify for bonuses.

Oliver has a Calendar bottom tab, a seven-day trail and Today's five on Home; admin has Learning calendar with day details and the same daily plan. Rewards are +2 once per qualifying day, +5 each seventh consecutive day, +5 once for the daily five. Scores of zero still celebrate finishing. Gaps never subtract stars. Civil-date calculations handle DST/leap days. Daily plans remain stable across reloads/devices and old unfinished sessions resume unchanged.

The continuing 400-day rotation has math, English (including weekly stories/phonics), Chinese, science and alternating geography/history. Existing word-pack IDs remain unchanged. Question generation now uses all prior same-skill snapshots for least-seen vocabulary/discovery targets, avoids the preceding set where possible, and changes procedural math combinations. Stretch math ranges are available at level 2; daily auto-selection waits until day 120 and twenty unhelped answers with 80% correct in the last six completed math rounds. See `content/STUDY_PROGRAM.md` for precise capacity/review limits. A domain test generates all 2,000 rounds / 10,000 presentations across the 400 days and validates keys/variation. These are repeatable practice opportunities, not 10,000 unique facts.

Private fresh snapshot: `.data/before-calendar-upgrade.json`. The browser preview uses a separate local copy in `.data/calendar-preview/`; never restore that copy to production or treat its QA answers as family progress. Unit tests cover migrations, streak gaps/DST, zero-score rewards, seven-day milestones, daily-five awards, partial/legacy/quest distinctions and child privacy. HTTP tests cover simultaneous starts/next/approvals, stable plans, authenticated calendar access and duplicate reward prevention. A local browser completed a 4/5 daily round, saw +2 bonus, calendar entry, 1/5 completion and preserved prior records. Parent day drill-down and 390×844 / 768×1024 / 1024×768 layouts were checked in Chromium; no horizontal overflow. Physical iPad/Safari remains untested.

Created 2026-10-16 in a new repository, independent of `spicyguoba/mathquest`.

## Completion cards and larger learning library (2026-10-16)

The child view now shows a mint-green completed exercise card with a text badge, latest finished-round score, and a date/time in the family's configured timezone. A zero score still counts as finished; abandoned rounds do not count. Category cards count distinct exercise IDs, so replaying cannot inflate completion totals. These counts describe participation, not mastery. Existing native rounds supply historical scores/dates without rewriting their question or answer snapshots.

There are 377 native exercises: six original skills, 35 discovery topics, sixteen new procedural math activities, and 320 vocabulary meaning/sentence activities. The word bank has 2,000 English headwords with original meanings/examples and 1,200 simplified Chinese headwords with pinyin, meanings, and example pairs. Twenty-word packs have separate meaning and sentence-completion games; each game samples five words, preferring words absent from the preceding finished round. Chinese audio uses Mandarin voices when available, including feedback; read-aloud during a question remains recorded as help. Flashcards load before the timed round. Paths are family practice suggestions, not standardized grade levels, native-Chinese age standards, or exact frequency rankings. See `content/VOCABULARY.md` for licenses, attribution, selection, and limits. Keep edition-1 pack IDs and membership stable after release.

Reading and Chinese have nested course cards, small paged exercise lists, word search, and path/finished filters. Parent reports default to attempted activities, with a subject filter and an option to include new exercises; observed rounds use one exercise picker rather than hundreds of buttons. The new discovery topics and their references are in `content/additions.json`; `scripts/expand-discoveries.mjs` authors only that additive catalog. Existing discovery and story IDs remain unchanged.

Persisted schema version 2 adds `legacyCompletions` through an additive idempotent migration. The copied original games report completed-round scores separately from native metrics and stars, with a local offline retry queue and idempotent server receipt. Historical legacy stars/unlocks are retained; dates are not invented for old saves that did not record them. Dated copied-game cards begin with rounds completed after this update. The GitHub Pages originals and their storage are untouched.

Local verification covers all 320 vocabulary activities, private answer/feedback keys, fresh replay sampling, every word's example/provenance, all sixteen math generators, migration preservation, latest completion/zero-score/abandoned semantics, and offline legacy completion retry. Unit/domain tests, isolated HTTP integration, and production build pass. A browser completed a Chinese round with one wrong answer, retained that feedback through reload, earned four stars, and showed the correct dated card/category count. Word search, path filters, paging, and a Chinese sentence question were exercised. Phone 390×844 and iPad 768×1024 / 1024×768 layouts had no horizontal document overflow; these are Chromium checks, not a physical iPad/Safari test.

Before release, a fresh private PostgreSQL snapshot was saved in ignored `.data/before-library-upgrade.json`. `.data/check-library-upgrade.mjs` compares prior question snapshots, first answers, source/quest IDs, earned unlocks, authentication/device versions, legacy keys, and unchanged-wallet conditions after deployment, expecting schema 2. It is read-only against PostgreSQL; never restore that snapshot over active family records. Production remains the same Vercel project and stable family URL described below. Verify READY, GitHub checks, authenticated live vocabulary lessons, and the preservation comparison before reporting the update live.

## Child navigation and discovery expansion (2026-10-16)

The parent reported that Oliver found the professional dashboard confusing. The root route now uses a separate `ChildWorld` component: one large Play/Keep playing action, picture worlds, persistent Home/Games/Stars navigation, large touch targets, short labels, and optional read aloud. Navigation is stored in URL fragments so browser Back works. There is no child-side sign-out control. `/admin` keeps the detailed parent view.

There are 21 new discovery topics and 210 original questions, added to the existing six skills. Science includes space, weather, habitats, and fossils. Geography includes maps, continents/oceans, countries, cultures, the U.S., Virginia, and all 50 state capitals in five alphabetical trails of ten. State cards are browsed one at a time, and both questions and answer choices stay in the selected trail. History includes Ice Age/early people, ancient river cities, European Middle Ages, Qin/Han/Tang/Song/Ming, Native nations, U.S. founding, past presidents, and freedom/civil rights. See `content/SOURCES.md` for sources and teaching boundaries; parent Learning insights includes the references.

New lessons appear before starting the timed round. Questions and feedback can be read aloud; question reading still marks help. Participation stickers are derived from completed rounds at any score, while stars retain correct-answer scoring. New topics prefer questions absent from the preceding completed round where the finite pool permits. Existing question snapshots are never regenerated during resume.

No persisted fields were repurposed or removed: the new topics use existing skill/session/difficulty fields and the same scoring/store format. Existing first answers, stars, legacy saves, story unlocks, materials, quests, passwords, and paired devices must remain intact. A private pre-deployment PostgreSQL snapshot is held in ignored `.data/before-child-upgrade.json`; use `.data/check-progress-upgrade.mjs` to compare immutable prior answers/questions after release. Do not overwrite the cloud row with that snapshot.

Local verification: all 11 unit/domain tests, the expanded isolated HTTP test, and production build pass. Browser exercised a full Ice Age round (one wrong answer, four correct), feedback reload, four-star award and sticker, state flashcard navigation and trail-five quiz, original favorites links, and parent report controls. Child layouts checked at 390×844, 768×1024, and 1024×768 with no horizontal document overflow; these are Chromium checks, not physical iPad/Safari tests. Build trace includes the new content JSON and excludes private data/env files.

## Verified locally

- Next.js production build, unit/domain tests and isolated HTTP integration tests pass. Dependency audit reports no known vulnerabilities.
- Browser exercised parent login, child pairing/admin lock, child dashboard, a whole native fraction round (one wrong answer, four correct), reload during feedback, star award and persistence, quest editing, and copies of all three legacy games.
- iPad portrait (768 × 1024), iPad landscape (1024 × 768) and phone (390 × 844) layouts inspected. No page-level horizontal overflow at the phone size. This is Chromium viewport testing, not a physical iPad/Safari test.
- Copied Math Quest: numeric keypad, answer, saved-round resume. Reading Rangers: trail, wrong-answer explanation, cloud save. Story Star Adventures: rank map and passage. All copied scripts parse; the actual copied story progression function is tested against repeated stories and failure reset.
- Repeated approvals and redemption requests cannot double-award, double-spend or double-refund stars.
- Production deployment trace includes all three copied HTML files and excludes `.data`, source-document text and `.env` files.
- Original production `/mathquest/`, `/mathquest/reading/` and `/mathquest/stories/` each returned HTTP 200. No changes were made to the original repository.

## Private local material state

The parent has a dated snapshot outside this repository: 19 original files, 347,197,274 bytes, copied and compared by SHA-256. An ignored `.data/snapshot-location.txt` points to it. Three connected Google shortcut targets were also read and saved as text reviews under the private snapshot, separately from its 19-file manifest.

The local private library has 19 entries and five recurring quests. Source reviews include math course contents/parent notes, opening Chinese L1 pages, first pages of all five PDFs inside the Chinese ZIP, school newsletters, and the connected remote-learning/BBCoin/Roblox outlines. The scanned old calendar remains a historical reference requiring visual review. Only reviewed topics drive the initial plan; a filename or shortcut alone is not treated as reviewed content.

Use `npm run materials:snapshot`, then Admin → Materials library → Import manifest for future additions. `npm run materials:sync -- --initial-plan` seeds five quests only when no plan exists. Do not overwrite later parent edits with a new seed. Original course PDFs remain local; the app references paper work and uses original digital questions.

## Hosting status

**Live:** https://oliver-lms-david-ferlemann.vercel.app . Vercel project `oliver-lms` is under the parent's `david-ferlemann` Hobby team, connected to `spicyguoba/oliver-lms` for Git deployments. Production uses the LMS's own login. With the parent's explicit approval, only this stable production domain is excepted from Vercel Authentication; generated deployment URLs and previews retain protection.

The initial cloud build is READY (`dpl_Ha13gKcrvpbsuQH8it1EnM4S1uRN`, source commit `093f2e2`). The free Neon resource `oliver-lms-db` is provisioned in `iad1` and connected only to production. `DATABASE_URL`, stable `SESSION_SECRET` and `ADMIN_PASSWORD_HASH` are configured in Vercel. The CLI is authenticated as `davidferlemann-9111`; its device code was already consumed and must not be reused. The ChatGPT connector's earlier authorization error does not prevent CLI deployment.

Cloud verification passed against actual PostgreSQL: health; requested parent login; wrong first answer retained through reload; five-answer round awarding four stars once; duplicate submissions/next requests; timing records; independent signed-in client reading saved history; CSRF rejection; child/admin separation; all three copied HTML files and cloud bridges. A live browser also exercised parent login, material inventory and an observed wrong-answer/reload flow. Only identifiable synthetic QA sessions were removed afterward. The family baseline is zero stars and zero native sessions, with 19 private material entries and five recurring quests imported into PostgreSQL.

A tracked `.vercelignore` allowlist limits CLI uploads to app source (32 entries, about 323 KB). It excludes `.data`, `.env.local`, local output, dependencies and source snapshots. Next's server trace separately excludes private data and includes the three legacy HTML files. Never deploy an unchecked directory, commit secrets, or print environment values.

The GitHub repository was created public by the parent. Private materials, credentials, snapshots and learning records are excluded from Git and deployment packaging. Stable local authentication secrets remain in ignored `.env.local`. Initial requested login is **admin / admin1234**; the parent should change it in Settings before recording real learning history. Do not change it on the parent's behalf without their chosen replacement.

The backend uses row-locked PostgreSQL transactions. Development's local file store is separate; production fails closed without database and authentication secrets. New folder additions require the explicit snapshot/import workflow above. The hosted app cannot watch this PC's folder.

## Important product boundaries

- Original-origin localStorage is still intact at the GitHub Pages site; the new domain cannot automatically import it. LMS copies have separate browser/cloud saves, with original key names. Cloud saves for legacy games use last-write-wins; do not play one legacy game concurrently on multiple devices.
- Native first answers are immutable. Help/tab changes/active time are recorded, while server elapsed time controls timing. Legacy events stay explicitly client-reported and separate from native insights.
- Timing and tab changes cannot prove calculator use or measure actual ability. Use supervised parent-started rounds for better context. These are supplemental practice activities, not school screening measures or diagnoses.
- Stars are encouragement, including helped correct answers. Independent accuracy excludes recorded help, tab changes and questions left open for ten minutes. No cash conversion or penalties from the BBCoin concept are enabled.
- The implementation is one family/one learner, with parent settings, editable quests/rewards, approvals, material reviews and exports. It is not a multi-school service, automatic folder watcher, full PDF hosting system or offline PWA.
