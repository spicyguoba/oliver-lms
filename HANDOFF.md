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
