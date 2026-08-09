# 04 — Connect the two halves

## Goal

Submitting the real form on `localhost` runs the real task and streams the real verdict back into
the page.

## Steps

1. **Write the server action** in `src/app/actions.ts` (`"use server"`):
   - Validate the submitted lead against the zod schema. **Validate here as well as in the
     browser** — client-side validation is a convenience, not a boundary.
   - Trigger `qualify-lead` with `tasks.trigger<typeof qualifyLeadTask>(...)`, importing the task
     as `import type` only. Importing it for real drags the Trigger.dev task bundle into the
     Next.js build.
   - Return `{ runId, publicAccessToken }` from the handle. **Trigger.dev generates that token
     automatically, already scoped to this single run** — do not build a token endpoint, do not
     call `auth.createPublicToken` by hand, and do not widen the scope.
   - Return nothing else. `TRIGGER_SECRET_KEY` stays server-side.

2. **Subscribe in the browser** with `useRealtimeRun(runId, { accessToken })` from
   `@trigger.dev/react-hooks`. Map the run's state to the three UI states from stage 03:
   queued/executing → waiting component (showing the phase from metadata), completed → verdict
   card, failed → error state.

3. **Handle the failure paths properly.** All three of these happen in practice:
   - the run fails (Anthropic error, malformed output) — show the error, keep the form filled in
   - the token expires mid-run (15 minutes; shouldn't happen on a ~10s run, but will if the task
     hangs) — say so plainly rather than showing a permanent spinner
   - the trigger call itself fails (bad or missing `TRIGGER_SECRET_KEY`) — this is the one that
     will actually bite during setup, so make its message name the likely cause

4. **Never leave a spinner as the terminal state.** Every path ends in a verdict or a message.

## Done-test

`npm run dev` and `npx trigger.dev@latest dev` both running. Fill in the form with a real lead
and submit:

- Status text changes while it runs, and reflects the task's actual phase.
- A real verdict renders — cross-check it against `npm run smoke -- <lead>` on the same lead.
  Different wording is fine; a different tier means the rubric in play isn't the one you just
  edited.
- The run appears in the Trigger.dev dashboard.
- Stop the Trigger.dev dev server and submit again: the page shows a sensible waiting-then-error
  state, not a spinner forever.

## Notes

- Check the browser devtools Network and source for leaked secrets before moving on. The only
  Trigger.dev credential that may reach the browser is the per-run public token.
- If the run completes but the page never updates, the token scope is the first thing to check,
  not the hook.
