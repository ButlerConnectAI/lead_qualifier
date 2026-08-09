# 06 — Tune the rubric

## Goal

A repeatable way to change `src/lib/icp.ts` and know whether the change helped, instead of
reading one verdict and guessing.

Not needed to ship. Start it once there's real output worth arguing with — and there will be,
because the first rubric is always too generous.

## Why this exists

The prompt is the product here. Everything else is plumbing that either works or doesn't, but the
rubric is only ever "better" or "worse", and that judgement decays fast without a record. This
pattern already proved itself in `C:\trigger-builds\src\research\` — reuse it rather than
inventing a new one.

## Steps

1. **Grow the example set** to 8–12 leads in `tools/example-leads/`. Add a real one (anonymised)
   every time a verdict is wrong — that's the whole point. Each carries an `expected` field:
   the tier Jake thinks it deserves, and one line on why.

   Fictionalise company names and any identifying detail. These are committed to git.

2. **Write `tools/score-all.mjs`** — triggers every example against the locally-running
   `trigger.dev dev` worker and prints a table: expected tier, actual tier, actual score,
   agree/disagree. One number at the bottom: how many matched.

   Trigger them as a batch rather than in sequence, and require `npm run dev:task` to already be
   running — the script should say so plainly rather than hanging if it isn't.

   Tier agreement is the metric, not score proximity. Whether a lead scores 71 or 78 doesn't
   change what Jake does on Monday; whether it's `nurture` or `qualified` does.

3. **Write `tools/RUBRIC_LOG.md`** — append-only. One entry per change: date, what was changed
   and why, the before/after match count, and the decision to keep or revert. Reverts get logged
   too; a rubric change that seemed obviously right and made things worse is the most valuable
   entry in the file.

4. **The loop:** form a hypothesis → edit `src/lib/icp.ts` → run `score-all.mjs` → log it → keep
   or revert. One change at a time. Two changes at once and the log can't tell you which one
   worked.

5. **Read the actual text, not just the score.** The hard-won lesson from `trigger-builds`: a
   change can pass every automated check and still be wrong in a way only reading the output
   catches. `npm run smoke -- <lead>` prints one full verdict for that.

## Done-test

Make a deliberate change to `src/lib/icp.ts` — tighten one disqualifier — and confirm the loop
detects it: the match count moves, the log records it, and reverting restores the previous count.

If tightening a disqualifier doesn't move any tier, the example set isn't discriminating. Add
leads that sit near the boundary, not more obvious ones.

## Notes

- Every full run costs real Anthropic money across every example. Cents, but don't leave it
  looping.
- Deploy after keeping a change. Editing the rubric and pushing to GitHub does **not** update
  the deployed task — see [`CLAUDE.md`](../CLAUDE.md).
- If Jake disagrees with a verdict, the first question is whether `icp.ts` actually says what he
  meant. It's usually the rubric being vague, not the model being wrong.
