# Runbook

How to run this thing yourself.

`CLAUDE.md` in this folder is written for Claude. **This file is written for you.** No code, no
jargon. If something here doesn't work as described, the file is wrong — say so and it gets fixed.

**Every command assumes you're in `C:\Lead Qualifier`.**

---

## Starting a fresh chat

Open a new chat in this folder and say:

> Read CLAUDE.md, HANDOFF.md and RUNBOOK.md, then tell me where we're up to before doing anything.

That's all it needs. `HANDOFF.md` is the detailed running record written for Claude — what's been
decided, what's been tried, what not to redo. It stays on your machine and is never published.

**Where the build is up to:**

| Stage | What it is | State |
|---|---|---|
| 00 | Project set up | Done |
| 01 | Your criteria written down | Done |
| 02 | The scorer | **Done** — you ran all three leads, all three matched |
| 03 | The screens | **Done** — built and you've run it |
| 04 | Join the form to the scorer | **Next, and not started** |
| 05 | Put it live | Not started — nothing is live yet, no website exists publicly |
| 06 | A way to measure rubric changes | Optional, later |

**Stage 04 is what makes the form real.** Right now, filling it in and pressing *Score this lead*
shows one of three saved examples and ignores what you typed. Stage 04 connects it to the scorer,
so what you type is what gets scored, and deletes the saved examples and the Preview strip so
there's nothing fake left to confuse a real result with.

Two ways to tell a fake from a real score until then: the Preview strip along the bottom of the
page, and the speed — a saved example appears in about three seconds, a real score takes 15–25
because the AI is actually reading the lead.

**Nothing since the README is committed yet** — the screens and the runbook are all sitting as
uncommitted changes. That's deliberate, so nothing gets locked in before you've looked. Ask for a
commit whenever you want one.

---

## Every command, in one place

| Command | What it does |
|---|---|
| `npm run dev:task` | Start the scorer. Leave it running. |
| `npm run smoke -- <name>` | Score a saved lead and print the verdict. |
| `npm run dev` | Open the website at localhost:3000. |
| `npm run new-lead` | Save a lead as a test case. |
| `npm run check-env` | Check your keys are where they should be. |
| `npm run deploy:task` | Push criteria or scorer changes live. |

Then jump to what you're doing:

- [Starting a fresh chat](#starting-a-fresh-chat) — what to say, and where the build is up to
- [Score a lead](#score-a-lead) · [Read the result](#read-the-result)
- [Look at the website](#look-at-the-website)
- [Change what "qualified" means](#change-what-qualified-means)
- [Two deploys, one folder](#two-deploys-one-folder) — the easiest thing to get wrong
- [When something breaks](#when-something-breaks)

---

## What this is

You describe a lead. The AI scores it against your written criteria and tells you whether it's
worth your week.

There are two halves and they run separately:

| Half | What it is | State |
|---|---|---|
| **The scorer** | Reads a lead, thinks, returns a verdict | Built and working |
| **The website** | The form you type into, and the page showing the result | Screens built, not yet joined to the scorer |

They live in the same folder but ship to different places, which is the one genuine trap in this
project. See [Two deploys, one folder](#two-deploys-one-folder).

---

## Score a lead

You need **two terminals**. In VS Code, `` Ctrl+` `` opens one, and the split-pane icon at the top
right of the terminal panel opens a second beside it.

**Terminal 1 — start the scorer.** Leave it running:

```
npm run dev:task
```

Wait for `Local worker ready`, about 10 seconds. Don't touch this terminal again. Closing it or
pressing Ctrl+C switches the scorer off.

**Terminal 2 — send it a lead:**

```
npm run smoke -- strong-fit
```

Takes 15–25 seconds. It's thinking, not stuck.

Three leads are saved to test with — `strong-fit`, `poor-fit`, `ambiguous`. Swap the name on the
end of that command. [What each one is.](#the-three-test-leads)

When you're finished, press `Ctrl+C` in Terminal 1.

---

## Read the result

It prints in five parts.

**1. The receipt**

```
Triggering qualify-lead (dev)
  lead: Northgate Plumbing Supply
  run: run_06fu7n45gmlk6nl2m76acm7d01
```

The scorer picked up the lead. That `run_...` ID is logged in your Trigger.dev dashboard if you
ever want to look back at one.

**2. The headline**

```
Verdict
  QUALIFIED  93/100  (12.2s)
  Northgate Plumbing Supply is a textbook fit: a named, high-frequency
  manual process, an owner ready to redirect real spend, and a hard deadline.
```

Tier, score out of 100, and one sentence you could read out loud. [What the tiers
mean.](#what-the-three-verdicts-mean)

**3. The reasoning — read this part carefully**

```
Criteria
  · Problem fit: strong
      Sixty quotes a week re-typed three times is a specific, high-volume manual process.
  · Budget signal: strong
      Already paying ~$1,200/month to an admin for this work and says so explicitly.
```

Nine criteria, each judged separately with its reason. This is where you find out whether the AI is
reasoning the way you would or just landing on the right answer by luck — **a tier can be right for
the wrong reasons.**

`unknown` means the lead didn't say. That is not the same as weak, and the scoring treats it
differently: silence is never held against a lead.

**4. What to do about it**

```
Biggest risk
  ...
Ask before committing
  · What does the current onboarding process involve, step by step?
Protect yourself
  · No definition of "done" exists yet — agree in writing what a fixed
    onboarding looks like, and what's explicitly out of scope.
Next action
  Book a call this week to confirm the quoting-sheet tool.
```

**"Ask before committing" is the most useful part in practice.** It's your question list for the
call, built from what the lead didn't tell you.

**"Protect yourself" is what to nail down before you start.** It appears on good leads too, and
that's the point — the projects that hurt were the ones that looked fine at inquiry and went wrong
after you'd said yes. No definition of done, no price on scope changes, no line between building
and supporting. This is where those get caught while you can still write them into a quote.

**5. The check against your own answer**

```
Against expectation
  ✓ matched qualified
```

Each saved lead carries your own verdict as an answer key, and this compares the two. A `✗` isn't
necessarily a bug — it's a disagreement between you and the criteria, and either one could be the
thing that's wrong.

---

## Look at the website

One terminal, nothing else running:

```
npm run dev
```

Then open **http://localhost:3000**. Press `Ctrl+C` when you're done.

**It is not connected to the scorer yet** — that's the next stage. The screens are wired to four
saved example verdicts so you can judge how they look before anything real flows through them.
Filling in the form and pressing *Score this lead* shows the waiting screen and then a result, but
that result is a saved example, not a score of what you typed. Press it three times to cycle
through all three.

Along the bottom is a **Preview** strip that jumps straight to each screen:

| Link | What it shows |
|---|---|
| Form | The blank form |
| Qualified | A green verdict, full of detail |
| Nurture | An amber verdict — the accounting firm |
| Disqualified | A red verdict, and how it looks with no questions to ask |
| Empty | A verdict with both lists empty, to check nothing looks broken |

That strip only exists on your machine. It never appears on the live site, and it gets deleted
once the real connection is in.

**What to judge:**

- Is the verdict readable top to bottom?
- Is "Ask before committing" easy enough to find? That's your list for the call.
- Would you be happy having this on screen in front of a client?
- Does it hold up narrow? Drag the browser window in until it's phone-width and check nothing runs
  off the side.

Background on why it looks the way it does is at the [end of this file](#about-the-design) — it's
not needed to run anything.

---

## What the three verdicts mean

The score isn't describing how good the inquiry looks. It's a **prediction**: *is this worth one of
your weeks?* You only get so many.

| Verdict | What it means | What you do |
|---|---|---|
| **Qualified** (70–100) | Real business, money exists, someone can decide, enough volume to be worth building for | Book the call this week |
| **Nurture** (40–69) | A real lead where something essential isn't known yet — budget, authority, timing, or the shape of the problem | Send the questions it generated |
| **Disqualified** (0–39) | Walk away | Two lines saying no |

The line between nurture and disqualified is deliberate: **saying no needs a reason, not just an
absence of reasons to say yes.** A company that doesn't yet know what it wants is a nurture, not a
reject — working out what to build *is* the service, so that's an opportunity that needs a
conversation.

Only three things force a disqualification:

1. The work is illegal or meant to deceive.
2. They've said outright there's no money — including offering equity, revenue share, or exposure
   instead.
3. They're a former client who publicly trashed you and came back.

**"Didn't mention money" and "has no money" are different leads.** The first is a nurture and you
ask. Only the second disqualifies.

---

## The three test leads

| Name | What it is | Should come back |
|---|---|---|
| `strong-fit` | Plumbing supplier, 60 quotes a week re-typed by hand, owner has budget and a deadline | Qualified |
| `poor-fit` | Pre-revenue founder offering 3% equity instead of money for an undescribed platform | Disqualified |
| `ambiguous` | Real accounting firm, "our onboarding is a mess, we think AI could help", then went quiet | Nurture |

These are fictional and safe to commit. The third is the important one — it separates *"a bad
lead"* from *"a lead nobody has asked anything yet"*, which is where a scoring system usually goes
wrong.

To save a real lead as a test case, fictionalise the name first, because these get committed:

```
npm run new-lead
```

---

## Change what "qualified" means

Everything the AI knows about your ideal customer is in one file:

**`src/lib/icp.ts`**

Open it. Ignore the first line and the last line — everything between is plain English, written for
you to edit. It covers who you help, the nine criteria, how they're weighed, the three hard
disqualifiers, what goes in "Protect yourself", and where the tier boundaries sit.

Edit the prose, save, score a lead again. If `npm run dev:task` is running it picks up the change
on save — no restart.

- **Nothing else needs to change.** No settings elsewhere, no code. Rewrite a paragraph and the
  scoring changes.
- **Once the site is live, this file only affects it after a redeploy.** That's the next section.

---

## Two deploys, one folder

The single easiest thing to get wrong here. Worth reading twice.

| What you changed | What ships it |
|---|---|
| How the website looks | `git push` — Vercel rebuilds on its own |
| The criteria, or the scorer | `npm run deploy:task` |

They are not the same button, and the failure is silent: **the site looks fine and quietly scores
with your old criteria.**

So if you edit `src/lib/icp.ts`, push it, reload the live site, and the verdicts haven't changed —
you haven't found a bug, you've found this. Run `npm run deploy:task`.

---

## When something breaks

| What you see | What it is |
|---|---|
| "Could not trigger qualify-lead", or it just hangs | Terminal 1 isn't running. Start `npm run dev:task` and wait for `Local worker ready` before retrying. |
| "TRIGGER_SECRET_KEY is not set" | `.env.local` is missing or empty. Run `npm run check-env` — it names exactly what's missing and where it belongs. |
| The run starts, then fails partway | Almost always the Anthropic key missing from the Trigger.dev dashboard. Check both DEV and PROD at [cloud.trigger.dev](https://cloud.trigger.dev). |
| `npm` isn't recognised, or commands do nothing | Wrong folder. You need to be in `C:\Lead Qualifier`. |

**The Anthropic key lives in the Trigger.dev dashboard and nowhere else** — deliberately, so there's
no copy of it on this computer.

Anything else: every run is logged at [cloud.trigger.dev](https://cloud.trigger.dev) with the full
trace. Find it by the `run_...` ID printed when you started it.

---

## About the design

Not needed to run anything — this is just the reasoning, so you can push back on it.

It's built from **krea.ai**, the page you picked. Rather than copy it by eye, I read the real
stylesheet off their site, so the greys, corner radius and type sizes are their actual numbers.

The rule that makes their site work: **it has no colour in it at all.** Every grey is a true
neutral. Depth comes from two greys one step apart with a hairline between them, and emphasis comes
from text being heavier or lighter — never from colour.

Keeping that rule buys something here. If nothing else is coloured, **the verdict is the only
colour on the page** — so a green, amber or red stripe across the top of the result reads instantly
without a badge shouting about it. The score itself stays black; the stripe already said it.

Two things to decide deliberately:

- **It's light**, because Krea is. Your own site is dark. The dark version is a small change, not a
  rebuild.
- **It no longer resembles butlerconnectai.com.** That was the point of using a different
  reference, but it's your call whether you're happy with it.

**When you rebrand, this doesn't need rebuilding.** Every colour and both fonts are declared in one
file and nothing else in the site names a colour, so a new brand is a short edit in one place. The
three verdict colours are kept separate from everything structural on purpose, so changing the look
doesn't drag them with it.
