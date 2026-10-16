<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Family LMS guardrails

Read README.md and HANDOFF.md before changing this app. The original GitHub Pages games live in a separate mathquest repository; do not alter that repository during LMS work.

- Never commit .env files, child learning records, source PDFs, ZIPs, extracted document text, or local snapshot manifests. Keep these outside git or under ignored .data/.
- Preserve storage and earned progress. Provide a versioned migration before changing persisted fields.
- Story pass is 4/5. Unlock requires the last three passed stories to have different IDs. Failure resets the current streak. Preserve earned unlocks.
- Server owns native questions, scoring, stars, approvals and timing. Legacy game events are client-reported and must remain separate from baseline metrics.
- Never infer cheating, diagnosis, or standardized ability from response speed. These are supplemental family practice games.
- Use short activities, positive feedback, large touch targets and readable passage text. Respect reduced motion. No ads or analytics trackers.
- Production must fail closed without Postgres and stable authentication secrets; Vercel's filesystem is not a durable database.
- Run relevant unit/HTTP tests and build after changes. Verify actual deployment status; a pushed commit alone is not a working deployment.
