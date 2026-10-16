# Original games

The three HTML sources in `legacy/` were retrieved from the parent's repository `https://github.com/spicyguoba/mathquest` on 2026-10-16. All story passages in `content/stories.json` are the original family-game corpus (20 stories / 100 questions).

Only these LMS copies are changed:

- Repoint navigation to the new app.
- Inject authenticated game saves and a same-origin save/event bridge.
- Record question presentation, first answers and reported help.
- Respect reduced-motion preferences.
- Correct copied story streak tracking to retain the last three passes including repeats and require three distinct story IDs before unlocking.

Original localStorage keys are preserved. The parent’s original hosted site, repository and saved data are untouched. Legacy answer keys remain in those game scripts, so legacy telemetry is labeled client-reported and excluded from server-graded insights. Cloud game saves use last-write-wins semantics; avoid playing the same legacy game on multiple devices simultaneously.
