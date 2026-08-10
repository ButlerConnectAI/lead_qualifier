# Lead Qualifier

AI Lead Qualifier. Jake fills out a form about a lead, clicks Analyze, a Trigger.dev task scores
the lead with Claude against a written ideal-customer profile, and the verdict streams back into
the page.

Global conventions (`~/.claude/CLAUDE.md`) apply here too — Windows paths, PowerShell 5.1 (no
`&&`), confirm before destructive actions. This file is local truths only.

## The WAT framework

This repo is organised around **WAT** — the harness used to *build* the qualifier, not the
qualifier itself:

- **W — `workflows/`** — numbered markdown instructions for Claude. Each file is one build stage
  with a goal, steps, and a done-test. Read the relevant one before starting that stage.
- **A — Agent** — Claude Code. No folder; it's whoever is reading this.
- **T — `tools/`** — scripts Claude runs to check, iterate, and verify.

`workflows/` and `tools/` are scaffolding. The product lives in `src/`. Don't deploy either of the
first two, and don't put product logic in them.

## Jake runs it, not you

`RUNBOOK.md` is the counterpart to this file: this one is written for Claude, that one is written
for Jake. Plain language, no code, no jargon.

**Stop at the point something is runnable and hand over the command.** A stage is not done because
the code is correct — it's done when Jake has run it and says it's right. Don't call the test
scripts on his behalf, don't declare done-tests passed, and don't decide whether output is good
enough; judging a verdict is a commercial call that belongs to him.

Any change to a command, script name, or workflow means `RUNBOOK.md` is now wrong. Update it in
the same pass — a runbook that lies is worse than no runbook.

## Stack

- **Trigger.dev SDK 4.5.9** — pinned to match the known-good version in `C:\trigger-builds`.
  Tasks in `src/trigger/` (see `trigger.config.ts` `dirs`).
- **Next.js App Router** with `src/app/`, TypeScript, Tailwind.
- **`@trigger.dev/react-hooks`** — `useRealtimeRun` for the live result.
- **`@anthropic-ai/sdk`** — called from the Trigger.dev task only, never from Next.js.

## Architecture: why the frontend doesn't wait

On submit, the Next.js server action triggers the task and immediately gets back a run ID and a
`publicAccessToken` scoped to that one run (Trigger.dev generates it automatically on trigger —
there is no separate token endpoint to build; default expiry 15 minutes). Both go to the browser,
which subscribes directly to Trigger.dev via `useRealtimeRun`.

**Vercel's work is over in about a second.** The lead never sits in a serverless function waiting
on Claude, so scoring can take as long as it needs without hitting a function timeout. This is the
whole reason for the extra moving part — don't "simplify" it into a Next.js route that awaits the
Anthropic call.

## The secret boundary — hard rule

| Key | Lives in | Never in |
|---|---|---|
| `ANTHROPIC_API_KEY` | Trigger.dev dashboard **only**, DEV + PROD | Vercel, the browser, git, this machine |
| `TRIGGER_SECRET_KEY` | Vercel (server-side) + local `.env.local` | The browser, any `NEXT_PUBLIC_*` var |
| per-run public token | Generated per request at trigger time | Anywhere persistent |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | — public by design |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel + `.env.local` | — public by design |
| `SUPABASE_SERVICE_ROLE_KEY` | **Nowhere.** Not used by this project | Everywhere. `check-env` fails if it exists |

The two Supabase variables are the only keys here that are meant to be readable by
anyone — they ship in the browser bundle. That is safe **only because row-level security is
switched on**, so `supabase/schema.sql` is security-critical code and not setup boilerplate. If
RLS is ever off, every lead in the table is readable by anyone who opens the site, and there is no
second line of defence behind it.

The service-role key bypasses every policy. Nothing here needs it, which is what keeps the
publishable key safe to expose. Reaching for it means the design drifted — same rule the Anthropic
key already lives under.

The frontend never calls Anthropic, so the Anthropic key has no reason to exist in Vercel. Any
future change that needs it there is a sign the architecture drifted — fix the architecture, not
the env.

**The Anthropic key is never written to disk on this machine either.** It doesn't need to be:
`trigger.dev dev` runs the task locally but pulls env vars from the dashboard's DEV environment.
Note that a local `.env` value *would* override the dashboard's — which is precisely why one must
not exist. `npm run check-env` fails if it finds one.

**Deliberately not using `syncVercelEnvVars`.** Trigger.dev's build extension pulls Vercel's env
vars into Trigger.dev. It's convenient and it quietly encourages putting the Anthropic key in
Vercel where it doesn't belong. Set Trigger.dev's env vars in the Trigger.dev dashboard directly.

## Two deploys, one repo

Pushing to GitHub deploys **the frontend only**, via Vercel. It does **not** deploy the task.

Any change to `src/trigger/` or `src/lib/` needs its own deploy:

```
npx trigger.dev@latest deploy
```

**`src/server/` is web-only and never needs a deploy.** It exists to keep the rule above
mechanical: accounts, the session, and lead history are all Next.js-side concerns, and putting
them in `src/lib/` would fire the deploy rule on every auth change for a task that knows nothing
about accounts. A rule that cries wolf stops being read. So:

| Folder | Ships via |
|---|---|
| `src/trigger/`, `src/lib/` | `git push` **and** `npm run deploy:task` |
| `src/server/`, `src/app/`, `src/components/` | `git push` only |
| `supabase/schema.sql` | Neither — pasted into the Supabase SQL editor by hand |

This is the easiest thing in the project to forget, and the failure is silent: the site looks
fine and quietly runs yesterday's scoring logic. If a rubric change doesn't show up in the output,
check this before debugging the prompt.

`src/lib/` is shared by both halves, so a change there usually means both a push and a deploy.

## Env validation before paid work

Carried over from a real `C:\trigger-builds` lesson: lazy per-variable checks only fire when that
variable is first touched, which can be *after* a paid Anthropic call has already run. Validate
every required key up front, before step one. `tools/check-env.mjs` does this outside a run.

## The dev loop — iterate without deploying

Don't burn a deploy to test a rubric change. Two terminals:

```
npm run dev:task     # trigger.dev dev — runs the task on this machine, hot-reloads on save
npm run smoke        # triggers it with a saved lead, prints the verdict
```

`trigger.dev dev` executes the task locally against the dashboard's DEV environment variables, so
the Anthropic key stays off this machine and edits to `src/lib/icp.ts` take effect on save. This
is the main iteration loop. Deploy only once the output looks right.

`npm run smoke` uses the **dev** `TRIGGER_SECRET_KEY` from `.env.local`, which routes to the local
worker. `npm run smoke -- --prod` needs the production key and hits the deployed task instead —
that one is for confirming a deploy landed, not for iterating.

## Model convention

`claude-sonnet-5`, following `C:\trigger-builds\src\lib\synthesize.ts`. Structured output so the
UI renders fields rather than parsing a paragraph. Keep `max_tokens` generous enough to cover
thinking plus the full verdict.

## The rubric lives in one file

`src/lib/icp.ts` holds the ideal-customer profile as plain English. It is meant to be edited by
Jake directly — good-fit industries, size range, real budget signals, hard disqualifiers, how to
weigh them. Changing what "qualified" means is a prose edit to that one file plus a deploy.

Don't scatter scoring criteria into the prompt, the form, or the UI. One source of truth.

## Accounts, and the fact that this now stores data

The site is behind a sign-in. Accounts are **invite-only**: there is no signup page, and Jake
creates users in the Supabase dashboard. That's a cost decision as much as a security one — every
scoring run spends Anthropic money, so self-registration would let a stranger spend it.

Three rules that are easy to erode:

- **The Data Access Layer is the boundary, not the proxy.** `src/proxy.ts` refreshes the session
  and does an optimistic redirect, but it runs on every request including prefetches and Next's
  own docs say not to rely on it. `verifySession()` / `getUser()` in `src/server/dal.ts` is the
  real check, and every page and every server action does it for itself. Deleting the proxy should
  cost usability, never safety.
- **Server actions are public endpoints.** `startQualifyRun`, `fetchRunSnapshot`, `recordOutcome`
  and `reconcileHistory` are all reachable without ever loading a page, so each one re-checks.
- **Never trust a verdict sent from the browser.** `recordOutcome` takes a run id and re-reads the
  result from Trigger.dev server-side.

**This is the first time the project stores anything.** Lead notes contain other people's names,
roles, and whatever was pasted into the form — that now lives in a third-party database rather
than only on Jake's screen. Worth knowing before it's discovered: deleting a user in the Supabase
dashboard cascades and takes their leads with them.

**One accepted limitation.** Trigger.dev only keeps run records for a while. If a run finishes
while the tab is closed and nobody opens the history page before it ages out, that verdict is gone
for good — the row goes to `abandoned`. The lead itself is never lost, because it's saved at
submit time, so the answer is always "score it again".

## Failure log

- **2026-08-08, `dev:task` never ran:** `package.json` invoked `trigger.dev dev`. The npm package
  is named `trigger.dev`, but the binary it installs is `trigger` — `node_modules/.bin/trigger`.
  Scripts must call `trigger dev` / `trigger deploy`. The `npx trigger.dev@latest deploy` form is
  different and does work, because there npx resolves the *package* name. Stage 00 was signed off
  on the npx form, so the broken script sat undetected until Jake first ran it.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- TRIGGER.DEV SKILLS START -->
## Trigger.dev agent skills

This project has Trigger.dev agent skills installed in `.claude/skills/`. Before writing or changing Trigger.dev code (background tasks, scheduled tasks, realtime, or chat.agent AI agents), load the most relevant skill: `trigger-authoring-tasks`, `trigger-getting-started`, `trigger-realtime-and-frontend`.
<!-- TRIGGER.DEV SKILLS END -->
