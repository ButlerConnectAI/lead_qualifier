# AI Lead Qualifier — inquiry in, go/no-go out

Describe a lead in a form, and Claude scores it against a written ideal-customer profile:
a tier, a score, nine criteria judged separately with reasons, the questions to ask before
committing, and the terms to get in writing before starting.

Next.js on Vercel for the form, a Trigger.dev task for the scoring, Claude for the
judgment. Built with Claude Code.

**Status:** live at
[lead-qualifier-beige.vercel.app](https://lead-qualifier-beige.vercel.app/). Submitting the
form triggers a real run and the verdict streams back into the page. Both halves are
deployed — the frontend on Vercel, the scoring task on Trigger.dev production.

**The site is behind a sign-in**, and accounts are invite-only — every run costs real money, so
there is deliberately no signup page. Signed-in users get their own saved history of everything
they've scored, separated by Postgres row-level security rather than by the UI hiding things.

## The problem it solves

A one-person agency has one genuinely scarce resource, and it isn't leads — it's weeks.
Every inquiry looks appealing at 9am on a Monday, and the ones that hurt aren't the
obvious time-wasters. They're the ones that read well, get accepted, and then overrun,
sprawl, or quietly reopen themselves six weeks after sign-off.

So the score isn't a description of how good the inquiry looks. **It's a prediction: will
I be glad I took this?** Two consequences follow from that framing, and they shape the
whole rubric:

- **A lead that reads beautifully and turns into three months of unpaid support was
  scored wrong**, even though nothing in the inquiry was misleading. The qualifier has to
  reason about how the engagement will go, not how the email is written.
- **Every verdict carries a "Protect yourself" section** — what to agree in writing before
  starting, based on how work of this shape actually goes wrong. It appears on strong
  leads too. Especially on strong leads.

## Architecture

The whole design turns on one decision: **the browser never waits on Claude.**

```mermaid
flowchart TD
    A[Form submit] --> B[Next.js server action]
    B --> M{Signed in?}
    M -->|no| N[Redirect to /login]
    M -->|yes| C[tasks.trigger — returns immediately]
    C --> P[(Save run to Supabase)]
    P --> D[run id + per-run public token]
    D --> E[Browser]
    E -.->|useRealtimeRun, direct subscription| F[Trigger.dev]
    E -.->|fallback: poll every 3s| L[Server action: read the run]
    L -.-> F
    C ==> G[Trigger.dev task: qualify-lead]
    G --> H[Validate every env var]
    H --> I[Parse lead against zod schema]
    I --> J[Claude — structured output]
    J --> K[Verdict]
    K -.->|streamed| F
    E -.->|on finish, re-read server-side| P
```

The server action triggers the task and gets back a run ID plus a `publicAccessToken`
scoped to that one run — Trigger.dev generates it at trigger time, so there's no token
endpoint to build. Both go to the browser, which subscribes to Trigger.dev directly.

**Vercel's work is over in about a second.** The lead never sits in a serverless function
waiting on an LLM, so scoring can take as long as it needs — thinking included — without
approaching a function timeout. That's the entire reason for the extra moving part, and
it's the thing not to "simplify" into a route handler that awaits the Anthropic call.

Every arrow above is implemented. The run's failure paths are wired too, and none of them
terminate in a spinner: a run sits in `PENDING_VERSION` when no worker can pick it up, so
that state gets a few seconds' grace and then names the missing command, backed by a stall
timer set above the task's own `maxDuration` so a slow run is never cut off early. A failed
run leaves the form filled in.

**The subscription is the fast path, not the only path.** A realtime stream can go quiet
without raising an error — a buffering proxy or a browser extension that blocks the
connection both present as a run that never ends — and a page that trusts it alone will sit
there until it times out and then blame the scorer for work the scorer already finished. So
the page also polls a server action that reads the run directly. Whichever reaches a terminal
state first wins. That endpoint answers only for this task's runs, only for the account that
started them, and returns only the fields the page renders — everything it can't answer for
looks identical from outside, so it never reveals whether a given run exists.

**Adding accounts made that endpoint's design load-bearing in a way worth spelling out.** Once
it checks "does this run belong to you", ownership has to be something it can always determine —
and a row-level-security query cannot distinguish *no such row* from *a row you can't see*. So
saving a run has to succeed before the run is allowed to proceed: if the history write fails, the
run is cancelled rather than started. Otherwise a run could exist that nothing is permitted to
poll for, and a paid verdict would have no way home — the exact failure the fallback above exists
to prevent.

## Design decisions worth explaining

**The rubric is prose, in one file.** [`src/lib/icp.ts`](./src/lib/icp.ts) holds the
ideal-customer profile as plain English — who the business helps, the nine criteria, how
they're weighed, the disqualifiers, where the tier boundaries sit. Changing what
"qualified" means is a paragraph edit, not a code change. Nothing about scoring lives in
the prompt, the form, or the UI, because criteria scattered across three files drift apart
within a month and no single one of them is the truth any more.

**Silence is never read as absence.** The single rule that overrides the rest. A lead that
doesn't mention budget is not a lead with no budget; an inquiry that names no problem is
not a company without one. Unknown criteria cap how high a lead can score and never drag
it down, and a real business whose only flaw is that nobody has asked it anything yet
can't score below the middle of the nurture band. This sounds obvious and is the single
thing the rubric got wrong twice — see below.

**Structured output, not a paragraph to parse.** The verdict is a zod schema in
[`src/lib/types.ts`](./src/lib/types.ts) converted to JSON Schema and handed to Claude via
`messages.parse()`. The UI renders fields; nothing regex-scrapes prose. The `.describe()`
calls on that schema are prompt text and are edited as prompt text — that's noted at the
top of the file, because the next person to touch it will assume they're documentation.

**`stop_reason` is checked before the content is touched.** A refusal comes back as HTTP
200 with empty or partial content. Read the content first and a refusal surfaces as a
confusing schema-parse failure instead of what actually happened. Truncation at
`max_tokens` gets its own error too, with the fix named in the message — thinking counts
against that budget, so the cap is not the size of the answer.

**Every environment variable is validated before step one.** Not lazily, per variable, on
first use. A lazy check can fire *after* a paid Anthropic call has already run, which
turns a missing config value into a bill. Carried over from a real failure in an earlier
project; there's a standalone `check-env` script so it can be verified without starting a
run at all.

**The Anthropic key is never written to disk on the build machine.** It lives in the
Trigger.dev dashboard, set for both DEV and PROD, and nowhere else — not in Vercel, not in
`.env.local`. `trigger dev` runs the task locally but pulls environment variables from the
dashboard's DEV environment, so local iteration works without a local copy. A local `.env`
value *would* silently override the dashboard's, which is exactly why one must not exist:
`npm run check-env` fails if it finds one.

**Trigger.dev's `syncVercelEnvVars` is deliberately not used.** It pulls Vercel's
environment into Trigger.dev, which is convenient and quietly encourages putting the
Anthropic key in Vercel — where the architecture says it has no reason to be, because the
frontend never calls Claude. If a future change needs that key in Vercel, the architecture
drifted; fix the architecture, not the env.

**Every lead field except two is optional.** A submission arriving with eight blanks is
itself a signal about the lead, and absent fields are rendered to the model as an explicit
`(not provided)` rather than omitted — so it sees the gap instead of inferring one from
the shape of the message.

**The task file is deliberately boring.** [`src/trigger/qualify-lead.ts`](./src/trigger/qualify-lead.ts)
sets run metadata, validates, calls `qualify()`, logs. All the scoring logic is in
`src/lib/` with no Trigger.dev import anywhere in it, so the prompt can be reasoned about
without retry behavior and run metadata tangled into it — and so the rubric is testable
without a run.

**The database enforces privacy, not the interface.** Accounts and history run on Supabase, and
the key the browser holds is public by design — it ships in the JavaScript bundle. What separates
one account's leads from another's is Postgres row-level security: every policy in
[`supabase/schema.sql`](./supabase/schema.sql) is scoped to `auth.uid()`, so a query physically
cannot return someone else's row. That makes the schema security-critical code rather than setup
boilerplate, and it means no `service_role` key exists anywhere in this project — one would bypass
every policy and is the thing that would make the public key unsafe.

The consequence worth stealing: authorization stops being an application-level filter you have to
remember to write correctly at every call site. `select … where user_id = ?` is a check you can
forget; a policy is one the database applies whether you remembered or not.

**The proxy is not the security boundary.** [`src/proxy.ts`](./src/proxy.ts) refreshes the session
and redirects signed-out visitors, but it runs on every request including prefetches, and Next's
own guidance is not to rely on it. The real check is a small data-access layer called next to the
data it protects — every page and every server action runs it for itself, because a server action
is a public endpoint reachable without ever loading a page. Deleting the proxy should cost
usability, never safety. That's testable, and it's how the redirect behaviour was verified: with
the proxy passing traffic straight through, protected routes still refused to render.

## The bug that shaped the design

The first version of the rubric told the model to let unknown fields drag the score down.
Reasonable-sounding, and wrong in a specific way: it punished leads for being **early**
rather than **bad**.

The tell wasn't the score. It was self-contradiction inside a single verdict — the model
recommended sending a follow-up email while labeling the lead dead. A lead you're about
to email is not a lead you've walked away from.

The fix was prose, not code: unknowns cap a lead at nurture rather than sinking it, and
disqualification now requires a positive reason to say no rather than an absence of
reasons to say yes. A self-check went in with it — **if the recommended next action is to
ask a question, the tier is nurture.**

### The same bug, one level up

It came back. A real accounting firm with a named pain area scored 38 and was labeled
`nurture` — but the nurture band starts at 40. The model had obeyed the prose rule when
picking the tier and scored the number independently, landing them on opposite sides of
the boundary. Left alone, that lead sorts *below* leads you'd never call, and the number
is what gets scanned in a list.

Two things were wrong, and only one of them was the boundary:

- **An unstated problem was being read as an absent one.** "We think AI could help" was
  marked down as a solution in search of a problem. But every operating business has
  manual processes worth automating — nobody had asked yet. That's the same inference as
  the original bug, moved from *fields* to *the problem itself*, and it's now banned
  globally rather than patched per-criterion.
- **A hard floor was missing.** A real business with no disqualifier, whose only issue is
  unanswered questions, now scores no lower than 45, and the model is required to check
  its own number against its own tier before returning.

**The pattern worth keeping:** when a verdict's recommended action disagrees with its own
tier, the rubric is miscalibrated — not the model. Both times, the contradiction was
visible in the output before anyone thought to question the score.

## Running it

You need a [Trigger.dev](https://trigger.dev) project, a [Supabase](https://supabase.com)
project, and an [Anthropic API key](https://console.anthropic.com). Node 20+.

```bash
npm install
cp .env.example .env.local     # fill in the Trigger.dev and Supabase values
```

Set `ANTHROPIC_API_KEY` in the **Trigger.dev dashboard**, under both DEV and PROD. Not in
`.env.local` — `npm run check-env` fails if it finds one there, and explains why.

For Supabase: paste [`supabase/schema.sql`](./supabase/schema.sql) into the SQL editor (it's
re-runnable), then add `http://localhost:3000/auth/callback` to the project's redirect URLs.
Confirm row-level security actually came up — by query, not by the Table Editor's badge, which is
frequently absent:

```sql
select relrowsecurity, (select count(*) from pg_policies where tablename = 'lead_runs')
from pg_class where relname = 'lead_runs';   -- expect: true, 4
```

**There is no signup page.** Accounts are created by invitation from the Supabase dashboard
(Authentication → Users → Add user), deliberately: every run costs money, so self-registration
would let strangers spend it. Invite yourself before first use.

Two terminals:

```bash
npm run dev:task              # runs the task locally, hot-reloads on save
npm run smoke -- strong-fit   # scores a saved lead, prints the verdict
```

Three fictional test leads ship with it — `strong-fit`, `ambiguous`, `poor-fit` — each
carrying an expected tier as an answer key, so a rubric edit that breaks calibration says
so. `npm run new-lead` saves another.

Editing `src/lib/icp.ts` while `dev:task` is running takes effect on save. That's the
iteration loop; deploying to test a prose change is unnecessary.

| Command | What it does |
|---|---|
| `npm run dev:task` | Run the task on this machine against the dashboard's DEV env |
| `npm run smoke -- <lead>` | Score a saved lead and print the full verdict |
| `npm run smoke -- --prod` | Same, against the deployed task |
| `npm run new-lead` | Save a lead as a test case |
| `npm run check-env` | Verify every key is where it belongs — and isn't where it doesn't |
| `npm run deploy:task` | Deploy the scoring task |
| `npm run dev` | Next.js dev server — needs `dev:task` running alongside it to score |

### Two deploys, one repo

`git push` deploys **the frontend only**, via Vercel. It does not deploy the task. Any
change to `src/trigger/` or `src/lib/` — including the rubric — needs `npm run deploy:task`
as well.

`src/server/` exists to keep that rule mechanical. Accounts, sessions and history are web-only
concerns, so they live there rather than in `src/lib/`; putting them in the shared folder would
make the deploy rule fire on every auth change for a task that knows nothing about accounts, and
a rule that cries wolf stops being read.

This is the easiest thing here to forget and the failure is silent: the site looks fine and
quietly scores with yesterday's criteria. If a rubric change doesn't show up in the output,
check this before debugging the prompt.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind · Trigger.dev 4.5.9 ·
`@trigger.dev/react-hooks` (`useRealtimeRun`) · Anthropic SDK · `claude-sonnet-5`
(effort `high`, structured output via zod) · Supabase (auth + Postgres with row-level security,
via `@supabase/ssr`) · Vercel · built with Claude Code
