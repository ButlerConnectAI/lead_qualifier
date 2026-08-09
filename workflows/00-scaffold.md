# 00 — Scaffold

## Goal

An installable repo where the Next.js dev server serves a page and the Trigger.dev CLI connects
to a real project. No product logic yet.

## Steps

1. **Ask Jake for the Trigger.dev project ref** (`proj_...`). Create a new project in the
   Trigger.dev dashboard for this build — do **not** reuse `proj_dngzznpspvnlzmewlbpo`, that's
   `trigger-builds` and mixing them makes runs and env vars hard to tell apart.

2. **Scaffold Next.js in place.** App Router, TypeScript, Tailwind, `src/` directory, no ESLint
   prompt loop. The folders `src/app`, `src/lib`, `src/trigger` already exist — the scaffolder
   must not clobber `src/trigger`, `workflows/`, `tools/`, or `CLAUDE.md`. If it insists on an
   empty directory, scaffold into a temp dir and move the files in.

3. **Add dependencies** — pin Trigger.dev to `4.5.9` to match the known-good version:
   - runtime: `@trigger.dev/sdk@4.5.9`, `@trigger.dev/react-hooks`, `@anthropic-ai/sdk`, `zod`
   - dev: `@trigger.dev/build@4.5.9`

4. **Write `trigger.config.ts`** at the repo root: the project ref, `runtime: "node"`,
   `dirs: ["./src/trigger"]`, sensible retries. **No `syncVercelEnvVars` extension** — see the
   secret boundary in [`CLAUDE.md`](../CLAUDE.md).

5. **Write a throwaway task** in `src/trigger/ping.ts` that logs and returns a string, purely to
   prove the connection. Delete it at the end of stage 02.

6. **Write `.gitignore`** covering `node_modules`, `.next`, `.env*` (except `.env.example`),
   `.trigger`, `.vercel`.

7. **Write `.env.example`** — `TRIGGER_SECRET_KEY` and `TRIGGER_PROJECT_ID` only. The Anthropic
   key is **not** here; it lives in the Trigger.dev dashboard. Note that in a comment so nobody
   "fixes" the omission later.

8. **Tell Jake to create `.env.local`** with his dev `TRIGGER_SECRET_KEY` from the dashboard's
   API Keys page. Never ask him to paste the key into chat.

## Done-test

Two terminals, both staying up:

```
npm run dev                        # serves the default page
npx trigger.dev@latest dev         # connects and lists the ping task
```

Then trigger `ping` from the Trigger.dev dashboard and see the log line appear in the CLI.

## Notes

- Next.js and Trigger.dev share `src/` but build independently — Vercel builds `src/app` and
  ignores `src/trigger`; the Trigger.dev bundler starts at `src/trigger` and pulls in only what
  it imports. Nothing special is needed to keep them apart, but nothing in `src/app` may import
  from `src/trigger` except as a `import type`.
- Git init is fine here. Don't create the GitHub remote yet — that's stage 05.
