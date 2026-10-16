# Adventure Club handoff

Created 2026-10-16 in a new repository, independent of `spicyguoba/mathquest`.

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

## Hosting status and next required action

The GitHub repository is `spicyguoba/oliver-lms`. It was created public by the parent; private source materials, credentials, snapshots and learning records are excluded from git and server deployment packaging.

**Vercel is not deployed yet.** The in-app Vercel browser is signed out, no Vercel CLI credentials are available, and the suggested Vercel connector has not been confirmed connected. Do not report a live LMS URL or durable cloud persistence as verified.

Once account access is connected: import the repo, provision/connect PostgreSQL (for example Neon), set DATABASE_URL / SESSION_SECRET / ADMIN_PASSWORD_HASH, deploy, import the private material inventory/initial plan, and verify persistence across reloads, devices and redeployment. Stable local secrets are in ignored `.env.local`; never print or commit them. Initial requested login is admin / admin1234. The parent should change it in Settings before storing real records in a public deployment.

The backend's PostgreSQL adapter uses a transaction and row lock for each family update. It has not been exercised against an actual hosted database yet. Development uses a serialized local file store. Production fails closed without the database and secrets.

## Important product boundaries

- Original-origin localStorage is still intact at the GitHub Pages site; the new domain cannot automatically import it. LMS copies have separate browser/cloud saves, with original key names. Cloud saves for legacy games use last-write-wins; do not play one legacy game concurrently on multiple devices.
- Native first answers are immutable. Help/tab changes/active time are recorded, while server elapsed time controls timing. Legacy events stay explicitly client-reported and separate from native insights.
- Timing and tab changes cannot prove calculator use or measure actual ability. Use supervised parent-started rounds for better context. These are supplemental practice activities, not school screening measures or diagnoses.
- Stars are encouragement, including helped correct answers. Independent accuracy excludes recorded help, tab changes and questions left open for ten minutes. No cash conversion or penalties from the BBCoin concept are enabled.
- The implementation is one family/one learner, with parent settings, editable quests/rewards, approvals, material reviews and exports. It is not a multi-school service, automatic folder watcher, full PDF hosting system or offline PWA.
