# Tools — the T in WAT

Scripts for checking, iterating, and verifying. No dependencies of their own — they parse `.env`
files themselves and degrade with a clear message when the thing they operate on doesn't exist
yet, so they work before `npm install` and before the product does.

| Script | What it answers |
|---|---|
| `check-env.mjs` | Are my keys where they should be — and nowhere they shouldn't? |
| `smoke-test.mjs` | Run a saved lead and show me the verdict. |
| `new-lead.mjs` | Save this lead as a test case. |

`score-all.mjs` and `RUBRIC_LOG.md` join them at [stage 06](../workflows/06-evaluate.md).

## The iteration loop

Two terminals. The first runs the task **on this machine** with hot reload; the second fires a
lead at it:

```
npm run dev:task              # leave running
npm run smoke -- strong-fit   # bare name, filename, or full path all work
```

Edit `src/lib/icp.ts`, save, run `smoke` again. Seconds per iteration, no deploy.

This works without an Anthropic key on your disk: `trigger.dev dev` runs the task locally but
pulls environment variables from the Trigger.dev dashboard's DEV environment. A local
`ANTHROPIC_API_KEY` would silently override the dashboard's, so `check-env.mjs` treats finding
one as a failure.

## After deploying

```
npm run smoke -- --prod
```

This exists for one specific trap: pushing to GitHub deploys the frontend but **not** the task.
When a rubric change doesn't show up in the UI, run this before you start debugging the prompt —
you're probably testing yesterday's logic. It needs the production `TRIGGER_SECRET_KEY`, which
isn't in `.env.local`; pass it for the one command rather than storing it.

## Notes

- Every `smoke` and `score-all` run costs real Anthropic money. Cents per run, but don't leave
  them looping.
- `example-leads/` is committed to git. Fictionalise company names and identifying detail.
