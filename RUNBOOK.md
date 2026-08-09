# Runbook

How to run this thing yourself.

`CLAUDE.md` in this folder is written for Claude. **This file is written for you.** No code, no
jargon. If something here doesn't work as described, the file is wrong — say so and it gets fixed.

---

## What this is

You describe a lead. The AI scores it against your written criteria and tells you whether it's
worth your week.

There are two halves, and they run separately:

- **The scorer** — reads a lead, thinks, returns a verdict. This is built and working.
- **The website** — the form you type into and the page that shows the result. Not built yet.

They live in the same folder but deploy to different places. That trips people up, so it has its
own section further down.

---

## Score a lead

You need **two terminals**. In VS Code: `` Ctrl+` `` opens one, and the split-pane icon at the top
right of the terminal panel opens a second beside it.

**Terminal 1** — start the scorer and leave it running:

```
npm run dev:task
```

Wait for `Local worker ready`. That's about 10 seconds. Leave this terminal alone from now on —
closing it or pressing Ctrl+C switches the scorer off.

**Terminal 2** — send it a lead:

```
npm run smoke -- strong-fit
```

Takes 15–25 seconds. It's thinking, not stuck.

Three leads are saved to test with:

```
npm run smoke -- strong-fit
npm run smoke -- poor-fit
npm run smoke -- ambiguous
```

When you're finished, press `Ctrl+C` in Terminal 1 to switch the scorer off.

---

## What you should see

```
Triggering qualify-lead (dev)
  lead: Northgate Plumbing Supply
  run: run_06fu7n45gmlk6nl2m76acm7d01
```

The scorer picked up the lead. `run_...` is a receipt — every run is logged in your Trigger.dev
dashboard under that ID if you ever want to look at one.

```
Verdict
  QUALIFIED  93/100  (12.2s)
  Northgate Plumbing Supply is a textbook fit: a named, high-frequency
  manual process, an owner ready to redirect real spend, and a hard deadline.
```

The headline. Tier, score out of 100, and one sentence you could read out loud.

```
Criteria
  · Problem fit: strong
      Sixty quotes a week re-typed three times is a specific, high-volume manual process.
  · Budget signal: strong
      Already paying ~£900/month to an admin for this work and says so explicitly.
```

Nine criteria, each judged separately with the reason. **This is the part to read carefully** —
it's where you find out whether the AI is reasoning the way you would, or just landing on the
right answer by luck. A tier can be right for the wrong reasons.

`unknown` means the lead didn't say. That's different from a criterion being weak, and the
scoring treats it differently — silence is never held against a lead.

```
Biggest risk
  ...
Ask before committing
  · What does the current onboarding process involve, step by step?
  ...
Protect yourself
  · No definition of "done" exists yet — agree in writing what a fixed
    onboarding looks like, and what's explicitly out of scope.
  ...
Next action
  Book a call this week to confirm the quoting-sheet tool.
```

**"Ask before committing" is the most useful part in practice** — it's your question list for the
call, generated from what the lead didn't tell you.

**"Protect yourself" is what to nail down before you start.** It appears on good leads too, and
that's the point — the projects that hurt were ones that looked fine at enquiry and went wrong
after you'd said yes. No definition of done, no price on scope changes, no line between building
and supporting. This section is where those get caught while you can still write them into a
quote.

```
Against expectation
  ✓ matched qualified
```

Each saved lead carries your own verdict as an answer key. This line compares the two. A `✗` isn't
necessarily a bug — it's a disagreement between you and the criteria, and either one could be the
thing that's wrong.

---

## What the three verdicts mean

The score isn't describing how good the enquiry looks. It's a **prediction**: *is this worth one
of your weeks?* You only get so many.

| Verdict | What it means | What you do |
|---|---|---|
| **Qualified** (70–100) | Real business, money exists, someone can decide, enough volume to be worth building for | Book the call this week |
| **Nurture** (40–69) | A real lead where something essential isn't known yet — budget, authority, timing, or the shape of the problem | Send the questions it generated |
| **Disqualified** (0–39) | Walk away | Two lines saying no |

The line between nurture and disqualified is deliberate: **saying no needs a reason, not just an
absence of reasons to say yes.** A company that doesn't yet know what it wants is a nurture, not
a reject — working out what to build is the service, so that's an opportunity that needs a
conversation.

Only three things force a disqualification: the work is illegal or meant to deceive; they've
said outright there's no money (or offered equity, revenue share, or exposure instead); or
they're a former client who publicly trashed you and came back.

Note that **"didn't mention money" and "has no money" are different leads.** The first is a
nurture and you ask. Only the second disqualifies.

## The three test leads

| Name | What it is | Should come back |
|---|---|---|
| `strong-fit` | Plumbing supplier, 60 quotes a week re-typed by hand, owner has budget and a deadline | Qualified |
| `poor-fit` | Pre-revenue founder offering 3% equity instead of money for an undescribed platform | Disqualified |
| `ambiguous` | Real accountancy firm, "our onboarding is a mess, we think AI could help", then went quiet | Nurture |

These are fictional and safe to commit. The third one is the important one — it's the case that
separates *"a bad lead"* from *"a lead nobody has asked anything yet"*, which is where a scoring
system usually goes wrong.

To save a real lead as a test case (fictionalise the name first — these get committed):

```
npm run new-lead
```

---

## Change what "qualified" means

Everything the AI knows about your ideal customer is in one file:

**`src/lib/icp.ts`**

Open it. Ignore the first line and the last line — everything between is plain English written for
you to edit. It covers who you help, the nine criteria, how they're weighed, the three hard
disqualifiers, what goes in "Protect yourself", and where the tier boundaries sit.

Edit the prose, save, then score a lead again. If `npm run dev:task` is running it picks up the
change on save — no restart needed.

Two things worth knowing:

- **Nothing else needs to change.** No settings elsewhere, no code. Rewrite a paragraph and the
  scoring changes.
- **Once the site is live, this file only affects it after a redeploy.** See below.

---

## Two deploys, one folder

This is the single easiest thing to get wrong here, so it's worth reading twice.

| What you changed | What ships it |
|---|---|
| How the website looks | `git push` — Vercel rebuilds on its own |
| The criteria, or the scorer | `npm run deploy:task` |

They are not the same button, and the failure is silent: **the site looks fine and quietly scores
with your old criteria.**

So if you edit `src/lib/icp.ts`, push it, reload the live site, and the verdicts haven't changed —
you haven't found a bug. You've found this. Run `npm run deploy:task`.

---

## When something breaks

**"Could not trigger qualify-lead" / it just hangs**

Terminal 1 isn't running, or you closed it. Start `npm run dev:task` again and wait for
`Local worker ready` before retrying.

**"TRIGGER_SECRET_KEY is not set"**

The file `.env.local` is missing or empty. It holds your Trigger.dev key. Run `npm run check-env` —
it names exactly what's missing and where it belongs.

**The run starts but fails partway**

Almost always the Anthropic key missing from the Trigger.dev dashboard. It lives there, not on
this computer — deliberately, so there's no copy of it on your disk. Check your project's
environment variables at [cloud.trigger.dev](https://cloud.trigger.dev), under both DEV and PROD.

**`npm` isn't recognised / commands do nothing**

You're in the wrong folder. Every command here assumes you're in `C:\Lead Qualifier`.

**Something else**

Every run is logged at [cloud.trigger.dev](https://cloud.trigger.dev) with the full trace. Find it
by the `run_...` ID printed when you started it.

---

## Every command

| Command | What it does |
|---|---|
| `npm run dev:task` | Start the scorer. Leave running. |
| `npm run smoke -- <name>` | Score a saved lead and print the verdict. |
| `npm run new-lead` | Save a lead as a test case. |
| `npm run check-env` | Check your keys are where they should be. |
| `npm run dev` | Start the website. *(Not built yet.)* |
| `npm run deploy:task` | Push criteria/scorer changes live. |
