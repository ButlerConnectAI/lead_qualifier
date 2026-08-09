# 05 — Deploy

## Goal

A public URL Jake can open on his phone, fill in, and get a real verdict from.

## Steps

**Backend first.** Deploy the task before the frontend — a live site pointing at a task that
doesn't exist in production is a confusing first failure.

1. **Set `ANTHROPIC_API_KEY` in the Trigger.dev dashboard**, production environment. Jake does
   this himself in the browser. Never ask him to paste the key into chat, and never write it to
   a file in this repo.

2. **Deploy the task** — `npx trigger.dev@latest deploy` — then confirm `qualify-lead` appears in
   the dashboard's production environment.

3. **Verify production independently of the frontend** — `node tools/smoke-test.mjs` against
   production. If this fails, stop here; nothing downstream will work.

**Then the frontend.**

4. **Push to GitHub.** Confirm `.env.local` is not in the commit before pushing. Jake creates the
   repo; ask for the URL rather than guessing at credentials.

5. **Import into Vercel** and set exactly one environment variable: `TRIGGER_SECRET_KEY`, the
   **production** key from the Trigger.dev dashboard, not the dev key. Plain server-side variable
   — no `NEXT_PUBLIC_` prefix, ever.

   **Do not add `ANTHROPIC_API_KEY` to Vercel.** If the deployed frontend seems to need it,
   something imports `qualify.ts` from `src/app/` and the fix is to remove that import.

6. **Deploy and test the live URL** end to end.

## Done-test

On the Vercel URL, on a phone:

- Submit a lead, watch the status change, get a verdict.
- The run shows up in the Trigger.dev **production** environment.
- View source and check the network requests: no `TRIGGER_SECRET_KEY`, no `ANTHROPIC_API_KEY`.
- The Vercel function log shows the trigger returning in around a second — not waiting for the
  full scoring run. If it's waiting, the architecture drifted; re-read
  [`CLAUDE.md`](../CLAUDE.md).

## From here on: two deploys

This is the point where the trap in [`CLAUDE.md`](../CLAUDE.md) goes live.

| Changed | What ships it |
|---|---|
| `src/app/` | `git push` — Vercel builds automatically |
| `src/trigger/`, `src/lib/` | `npx trigger.dev@latest deploy` |
| `src/lib/` specifically | **both** — it's shared |

Editing `src/lib/icp.ts` and pushing changes nothing about the scoring. That's the one to
remember, because it's the file that gets edited most.
