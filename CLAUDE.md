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
