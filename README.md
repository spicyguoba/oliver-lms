# Adventure Club

A family LMS for short, encouraging learning adventures. Separate from the original `spicyguoba/mathquest` GitHub Pages site: no changes to its files, URLs, or localStorage.

Live family site: https://oliver-lms-david-ferlemann.vercel.app . Students sign in to their own world; parents sign in to their linked student's dashboard. Admin manages all learners and logins. The production site uses the LMS login; deployment URLs and previews retain Vercel protection. See HANDOFF.md for verified hosting and private material snapshot details.

## What works

- **Map games**: 35 visual exercises covering seven continents, 94 selected countries by region and in world mixes, all 50 U.S. states, capitals and place facts. Explore cards first, then tap numbered map shapes in short star-earning rounds. Zoom, large matching buttons and simplified map outlines support touch play.
- **Amazing people**: 500 scientists, computer pioneers, inventors, leaders, thinkers, writers, artists and explorers in fifty ten-person packs plus a mixed game. Cards include contributions, life dates, sources and 425 reusable photos/portraits with individual credits; other cards clearly show that a picture is unavailable. Picture, achievement and timeline questions use the normal saved progress/calendar/star system. See [sources, image rights and teaching choices](content/EXPLORERS.md).

- Top star counters show **stars earned today**, including bonuses, and roll over at midnight in the family's timezone. The Stars/Rewards wallet separately shows the balance available to spend. Admin's **User accounts** supports username/learner search, role/status filters, account creation, username/password edits and access controls.

- **Chess Club** at `/chess`: ten interactive guides on castling, checkmate, stalemate and promotion; full games and three guided endgame starts against five computer levels. Four board palettes and three original piece themes save per learner. Every hint/undo needs a three-question study quiz, passed with at least 2/3. Undo takes back the learner turn and computer reply. Finished quizzes earn one star per correct answer; first lesson completions earn one star. Games, answers, timing, themes and progress persist, with manager details in the parent dashboard and both calendars. The computer is built in, with no external AI account or fee. Rules use [chess.js](https://jhlywa.github.io/chess.js/); its license is distributed in [public/chess-license.txt](public/chess-license.txt).

- **Star Dash** at `/dash`: twenty progressively faster, longer, denser cube-runner courses, each with an original visual theme and synthesized music, plus jump/crash/finish sounds. New cube runs use timed taps; ship/wave modes use hold and release. Gravity/dual portals, rings, pads and speed gates add later challenges. Keyboard and pause controls are available. Clearing a course reveals one server-graded question from the existing learning library and unlocks the next world. Correct answers award one study star (three for level 20), once per level per learner. Wrong first answers remain saved; replaying offers a fresh question. The learning calendar and parent activity report include question outcomes and timing, separate from five-question exercise benchmarks.

- **Admin / parent / student accounts** with separate passwords. The initial learner logins are `oliver`, `test1`, `test2`, with linked parents `oliverparent`, `test1parent`, `test2parent`. Only admin sees the learner picker and **User accounts** controls. Admin can create additional logins linked to an existing profile, edit usernames/roles/links, reset passwords, disable accounts and revoke sessions. Students and parents cannot see or switch to another learner. Their progress stays independent. Admin exports include all learners; parent exports include only their linked learner. Neither export contains password hashes.

- Completion cards show the latest finished score/date with a green shade and text badge; world and vocabulary category cards show total/finished/left. Replays do not inflate completed counts. Abandoned rounds do not count.
- 377 native exercise cards: 320 vocabulary meaning/sentence activities (2,000 English and 1,200 Chinese words with examples), sixteen additional procedural math activities, thirty-five discovery topics, and the six original skills. Word packs have twenty flashcards and short five-question rounds, with Starter/Growing/Challenge filters, search, paging, pinyin, and Mandarin read aloud. See [word-bank provenance and practice limits](content/VOCABULARY.md).

- Child dashboard, daily practice suggestions, star wallet, reward requests, parent approvals, recurring workbook/reading quests, learner profile and parent settings.
- **Parent dashboard → Rewards** records delivery with **Mark completed**, a chosen completion date and private parent notes. Completed rewards appear in both calendars; only admin and the linked parent can see notes. Stars are reserved when requested and never charged again on completion. Approval for later and refunds remain separate actions.
- A child-first home with large Play, Games, and Stars controls, picture worlds, a consistent Home button, read-aloud support, and participation stickers. Parent reports retain their detailed view.
- Science, geography, and history now have thirty-five discovery topics and 322 fixed question variants, including world/country/culture introductions, 50 states in five trails, Virginia, Ice Age/early people, ancient cities, Middle Ages, selected Chinese dynasties, Native nations, U.S. founding, past presidents, civil rights, inventions, plant life, water, matter, and light/sound. See [content sources and teaching choices](content/SOURCES.md).
- Parent reports retain every first answer, including wrong answers, server elapsed time, browser-reported active time/help/tab changes and parent-started observed mode. Legacy browser-reported events are separate from server-graded insights.
- Copies of all three original games at `/games/math/`, `/reading/`, `/stories/`, with their original storage keys and cloud save synchronization. Their own stars/unlocks remain separate from the LMS wallet.
- Story pass requires 4/5. Only three different consecutive passed stories unlock the next rank. Failure clears the current streak; previously earned unlocks remain.
- Private material inventory with SHA-256 fingerprints, dated local snapshots, review notes and source-linked assignments. Changed files are new versions; re-imports retain existing notes and quests.
- Account authentication with salted scrypt password hashes, signed HttpOnly cookies, server-enforced roles and learner links, same-origin mutations and persistent login throttling. Resetting credentials or changing access revokes older sessions. Opening a learner's world signs the grown-up out and starts that student's scoped session.

## Run locally

Requires Node 24.

```sh
npm ci
node scripts/create-secrets.mjs
npm run dev
```

Open `http://127.0.0.1:3000`. Initial administrator username: `admin`; password: `admin1234`. Existing hosted administrator credentials are preserved. A fresh database creates the six parent/student account records without passwords; set passwords in **Admin → User accounts** before using those logins. Starter production credentials are provisioned privately and are never committed. Grown-up sessions last 12 hours; student sessions last 30 days.

Without `DATABASE_URL`, development uses ignored `.data/family.json` with serialized atomic writes. This is single-process local development storage. It is **never used in production**. Keep `.env.local` stable so sessions remain valid. Do not delete `.data` to update the app.

## Vercel deployment

1. Import this GitHub repository into your Vercel account. Framework: Next.js, Node 24. Build: `npm run build`.
2. Add a PostgreSQL database through the [Vercel Marketplace](https://vercel.com/docs/marketplace-storage), such as Neon. Connect it to the project so `DATABASE_URL` is set. Use separate databases for preview and production if both will be used.
3. Set `SESSION_SECRET` and `ADMIN_PASSWORD_HASH` from your ignored local `.env.local` in Vercel's encrypted environment settings. Do not commit these values. `node scripts/create-secrets.mjs` creates both once and refuses to replace existing secrets. The hash supports the requested initial password.
4. Deploy/redeploy after setting variables. API health must return HTTP 200. Missing database/secrets causes HTTP 503 rather than silently losing progress on a Vercel instance.
5. Sign in, import the private material manifest, then set a new parent password. For initial setup only, run `materials:sync -- --initial-plan` against the hosted URL with `LMS_URL` and `LMS_ADMIN_PASSWORD` in your local environment. The first run adds five material-based quests; later runs never overwrite an existing plan.
6. Verify login, answer a question, reload, complete a round, and read the result from another signed-in device. Test a deployment restart/redeploy before depending on cloud persistence.

PostgreSQL schema initialization is additive and runs automatically. Version 9 adds isolated chess records without changing existing progress. Version 8 makes bedtime-story and board-game rewards available once each local day, preserving costs, balances and history. Version 7 adds account records and retains all learning profiles and prior authentication settings. Earlier migrations retain reward completion dates/notes, Star Dash progress, legacy completion logs and calendars. The database uses a single family row with JSONB data. Each update locks that row in a transaction, making scoring, approvals and reward deductions atomic across instances. This intentionally serves a small family club, not a public multi-tenant school platform. Database backups should be enabled with your provider. The admin export omits authentication hashes and includes learning history; it is an export, not a restore tool.

## Materials and future additions

```powershell
npm run materials:snapshot
npm run materials:sync -- --initial-plan
```

The snapshot command defaults to the parent's study folder on this computer and writes verified copies outside this repository under `../oliver-lms-data/snapshots/<timestamp>/`. It also writes ignored `.data/materials-manifest.json`. Arguments can override the source and destination parent folders. No source file is edited. Symlinks are skipped.

For future additions, rerun the snapshot and import its manifest in **Admin → Materials library**, or run `npm run materials:sync`. Review each new item and add/update short quests in **Study plan**. This is an explicit refresh workflow, not an unattended folder watcher. The hosted app cannot directly read a folder on your Windows PC.

Original PDFs/ZIPs and Google shortcuts are never placed in `public/` or committed. The course book is restricted to home use and explicitly forbids internet redistribution, so the hosted app uses original questions on its topics and references the local workbook for paper practice. Google `.gdoc`/`.gsheet` files are pointers; their byte snapshot does not contain the document contents. Connected text reviews are saved in the local private snapshot where available; unreadable/image-only files remain marked for review. There is no automatic OCR or AI question generation from unreviewed documents.

The first plan uses the math parent notes and course contents; Grade 2 phonics/retelling topics; Chinese L1 number, plant and introduction practice; and optional screen-free prior-grade reinforcement. L2 Chinese stays an extension until the parent checks readiness. Old newsletter dates are historical topic sources, not current school deadlines.

## Benchmarks and limits

The app records the first submitted answer once. Retries cannot replace a wrong answer or award duplicate stars. Each completed native round awards one star for each correct answer; helped answers still earn encouragement stars but are excluded from independent accuracy.

“Independent” means no recorded help, no reported tab change, and elapsed time below ten minutes. Correct-answer time is the median **server elapsed** time, which includes network time and time away from the screen. Browser active time/tab changes are self-reported context. Parent-observed mode requires the parent to start the round; actual adult observation is still necessary. A website cannot detect another device's calculator or establish actual ability from timing alone.

These activities supplement instruction. They are not VALLSS/DIBELS measures, standardized benchmarks, diagnoses, or substitutes for school instruction. No ads, analytics trackers, camera, microphone or child email account are required.

The original GitHub Pages origin's localStorage cannot be read by a new domain. Existing old-site progress remains intact there. New LMS copies start their own progress and then sync across paired devices. Do not promise automatic historical progress transfer.

## Verification

Oliver's **Calendar** tab shows daily topics, round scores, earned stars and a seven-day trail. **Admin → Learning calendar** adds first-answer and timing details. A streak day requires **21 study stars** from completed club games, Star Dash questions and approved quests. Bonus stars do not count toward the 21; reward spending does not reduce daily progress. Home and both calendars show progress toward the goal. Reaching it earns +2 bonus stars, every seventh streak day earns +5, and finishing the daily five earns +5 independently of score. Home supplies **Today's five**, with a saved 400-day rotation spanning mathematics, English, Chinese, science, geography and history. Breaks never remove stars. See [the practice program](content/STUDY_PROGRAM.md) for question rotation, grade 3 extensions, historical data and reward rules.

```sh
npm test
npm run test:api
npm run build
```

Unit tests cover the three-different-consecutive story rule, failure reset, terminal rank, private answer keys, immutable first answers, idempotent scoring, hints/resume, content validity and session tampering/expiration. HTTP integration tests launch an isolated development server and check authentication, CSRF, child/admin separation, server-owned scoring, role restrictions and legacy game serving. Test data is separate from the family records.

Before delivery, exercise the UI at iPad and phone sizes, verify copies of all three games, and check the original production URLs still respond. The local preview is not evidence of a Vercel deployment. See `HANDOFF.md` for actual verified status.

Star Dash now teaches timed taps, gravity flips, mirrored cubes, ship/wave controls, rings, pads and speed gates across twenty worlds. Hold-to-auto-jump is removed for new cube runs. Old saves retain their replay engine and study rewards; see HANDOFF.md for the versioned input protocol and verification.
