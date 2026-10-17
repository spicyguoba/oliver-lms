# Adventure Club

A family LMS for short, encouraging learning adventures. Separate from the original `spicyguoba/mathquest` GitHub Pages site: no changes to its files, URLs, or localStorage.

Live family site: https://oliver-lms-david-ferlemann.vercel.app . Sign in as the parent, then choose **Open Oliver’s world** to pair his device and lock the parent area. The production site uses the LMS login; deployment URLs and previews retain Vercel protection. See HANDOFF.md for verified hosting and private material snapshot details.

## What works

- Completion cards show the latest finished score/date with a green shade and text badge; world and vocabulary category cards show total/finished/left. Replays do not inflate completed counts. Abandoned rounds do not count.
- 377 native exercise cards: 320 vocabulary meaning/sentence activities (2,000 English and 1,200 Chinese words with examples), sixteen additional procedural math activities, thirty-five discovery topics, and the six original skills. Word packs have twenty flashcards and short five-question rounds, with Starter/Growing/Challenge filters, search, paging, pinyin, and Mandarin read aloud. See [word-bank provenance and practice limits](content/VOCABULARY.md).

- Child dashboard, daily practice suggestions, star wallet, reward requests, parent approvals, recurring workbook/reading quests, learner profile and parent settings.
- A child-first home with large Play, Games, and Stars controls, picture worlds, a consistent Home button, read-aloud support, and participation stickers. Parent reports retain their detailed view.
- Science, geography, and history now have thirty-five discovery topics and 322 fixed question variants, including world/country/culture introductions, 50 states in five trails, Virginia, Ice Age/early people, ancient cities, Middle Ages, selected Chinese dynasties, Native nations, U.S. founding, past presidents, civil rights, inventions, plant life, water, matter, and light/sound. See [content sources and teaching choices](content/SOURCES.md).
- Parent reports retain every first answer, including wrong answers, server elapsed time, browser-reported active time/help/tab changes and parent-started observed mode. Legacy browser-reported events are separate from server-graded insights.
- Copies of all three original games at `/games/math/`, `/reading/`, `/stories/`, with their original storage keys and cloud save synchronization. Their own stars/unlocks remain separate from the LMS wallet.
- Story pass requires 4/5. Only three different consecutive passed stories unlock the next rank. Failure clears the current streak; previously earned unlocks remain.
- Private material inventory with SHA-256 fingerprints, dated local snapshots, review notes and source-linked assignments. Changed files are new versions; re-imports retain existing notes and quests.
- Parent authentication with salted scrypt password hashes, signed HttpOnly cookies, role checks, same-origin mutations and persistent login throttling. Child pairing locks the admin session.

## Run locally

Requires Node 24.

```sh
npm ci
node scripts/create-secrets.mjs
npm run dev
```

Open `http://127.0.0.1:3000`. Initial parent username: `admin`; password: `admin1234`. Set a unique password in Settings before using a hosted deployment with real records. Parent sessions last 12 hours; child sessions last 30 days. Open Oliver's world to pair a device and lock the parent session.

Without `DATABASE_URL`, development uses ignored `.data/family.json` with serialized atomic writes. This is single-process local development storage. It is **never used in production**. Keep `.env.local` stable so sessions remain valid. Do not delete `.data` to update the app.

## Vercel deployment

1. Import this GitHub repository into your Vercel account. Framework: Next.js, Node 24. Build: `npm run build`.
2. Add a PostgreSQL database through the [Vercel Marketplace](https://vercel.com/docs/marketplace-storage), such as Neon. Connect it to the project so `DATABASE_URL` is set. Use separate databases for preview and production if both will be used.
3. Set `SESSION_SECRET` and `ADMIN_PASSWORD_HASH` from your ignored local `.env.local` in Vercel's encrypted environment settings. Do not commit these values. `node scripts/create-secrets.mjs` creates both once and refuses to replace existing secrets. The hash supports the requested initial password.
4. Deploy/redeploy after setting variables. API health must return HTTP 200. Missing database/secrets causes HTTP 503 rather than silently losing progress on a Vercel instance.
5. Sign in, import the private material manifest, then set a new parent password. For initial setup only, run `materials:sync -- --initial-plan` against the hosted URL with `LMS_URL` and `LMS_ADMIN_PASSWORD` in your local environment. The first run adds five material-based quests; later runs never overwrite an existing plan.
6. Verify login, answer a question, reload, complete a round, and read the result from another signed-in device. Test a deployment restart/redeploy before depending on cloud persistence.

PostgreSQL schema initialization is additive and runs automatically. Version 2 uses a single family row with JSONB data and adds a separate client-reported legacy completion log to version 1. Each update locks that row in a transaction, making scoring, approvals and reward deductions atomic across instances. This intentionally serves one family, not a public multi-tenant school platform. Database backups should be enabled with your provider. The admin export omits authentication hashes and includes learning history; it is an export, not a restore tool.

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

```sh
npm test
npm run test:api
npm run build
```

Unit tests cover the three-different-consecutive story rule, failure reset, terminal rank, private answer keys, immutable first answers, idempotent scoring, hints/resume, content validity and session tampering/expiration. HTTP integration tests launch an isolated development server and check authentication, CSRF, child/admin separation, server-owned scoring, role restrictions and legacy game serving. Test data is separate from the family records.

Before delivery, exercise the UI at iPad and phone sizes, verify copies of all three games, and check the original production URLs still respond. The local preview is not evidence of a Vercel deployment. See `HANDOFF.md` for actual verified status.
