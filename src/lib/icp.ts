/**
 * The ideal-customer profile, in plain English.
 *
 * Rewritten 2026-08-08 from Jake's own judgment, replacing the first-draft
 * guess. The changes that matter: not knowing what to build is no longer a
 * negative, silence is never read as absence, the disqualifier list is down to
 * three, and engagement risk is reported as terms to agree rather than points
 * deducted.
 *
 * This is the only place scoring criteria live. Don't copy fragments of it
 * into the prompt, the form, or the UI.
 *
 * Editing this file changes nothing about the deployed task until you run
 * `npm run deploy:task`. See CLAUDE.md, "Two deploys, one repo".
 */

export const IDEAL_CUSTOMER_PROFILE = `
# Who this business is

ButlerConnectAI is a one-person AI-automation agency. It builds workflow automation for small
and mid-sized businesses — mostly in n8n, sometimes as custom code — connecting the tools a
company already uses so that manual, repetitive work happens by itself.

What clients actually buy is hours back and errors removed.

**Working out what to build is part of the service, not a prerequisite for it.** A company that
says "we're interested in AI but we don't know how it would help us" is a legitimate lead, not a
confused one. So is a company whose leadership has mandated an AI project without naming a
problem. Someone has to find the problem, and that someone is the operator. Never mark a lead
down for failing to have done that work in advance.

Because this is a solo operator, capacity is the scarcest resource. The score answers one
question: **is this worth one person's limited weeks?** It is a prediction about how the
engagement will actually go, not a description of how the inquiry reads.

# The one rule that overrides the rest

**Never treat silence as evidence.** If the lead doesn't mention a budget, that is not "they
have no budget". If no problem is described, that is not "they have no problem" — every real
operating business has manual processes worth automating; nobody has asked yet. If no timeline
is given, that is not "there is no urgency".

An unanswered lead and a bad lead look identical on paper and are completely different
commercially. Mark what the lead doesn't say as 'unknown', put it in the questions list, and
move on. The only things that count against a lead are things the lead actually says.

# The criteria

Judge every lead against these nine, in this order. Use these exact names.

## 1. Problem fit

Is there a real business here with work that software could take over?

Strong: a specific named process — "we re-key about forty invoices a week from email into QuickBooks".

Adequate: a real operating business with an area of pain named loosely — "our onboarding is a
mess", "we spend too long on reporting". This is a normal, healthy starting point. It is not a
weakness and must not be scored as one.

Adequate: a real operating business interested in automation with no area named at all. The
first conversation finds it.

Weak: the problem is really a staffing, sales, or management problem wearing an automation
costume, and automating it would not help.

Never use the phrase "solution in search of a problem" to mark a lead down. Not having found the
problem yet is the normal condition of a new lead.

## 2. Volume and frequency

How often does the work happen, and how much of it is there?

Automation value is roughly linear in volume. Forty invoices a week is a business; forty a year
is a favor. This is judged on its own rather than folded into problem fit, because a perfectly
described process that happens twice a year is not worth a week of building.

Strong: daily or weekly, or high enough volume that someone's job is visibly consumed by it.
Adequate: monthly, or seasonal but heavy when it lands.
Weak: genuinely occasional work, where the build would cost more than the hours it saves.
Unknown: not stated — ask. Do not assume low volume.

## 3. Budget signal

Look for evidence that money exists and someone expects to spend it.

Real signals: a stated number or range; what they currently pay a person or agency to do this;
an existing tool subscription they're replacing; approved or allocated budget; a previous paid
project of similar shape.

Not signals, but not negatives either: "open to discussing budget", "depends on the price",
enthusiasm on its own.

**Silence about money and a stated absence of money are different leads.** A lead that simply
doesn't mention budget is 'unknown' — ask them. A lead that says "we have no budget", "would you
do this for equity", "revenue share", "spec work", or "it'd be great exposure" is a hard
disqualifier. Only the second kind counts against them.

### The one exception: free consulting for a name

If the company is one whose name would carry weight as a reference — a name this operator's
target clients would recognize, or a logo that would change how the website reads — then free
*consulting* is a legitimate trade. The payment is the reference.

This does not apply to free *building*. Consulting yes, delivery never.

When this applies, do not disqualify. Score it on the rest, and put these in Protect yourself:
agree in writing up front that the name can be used publicly, because that is the actual payment
and plenty of large companies will refuse it after the fact; and time-box the consult with a
defined output, because a free consult with no edge on it becomes unpaid delivery.

## 4. Decision authority

Can the person in front of you actually say yes?

Strong: an owner, founder, partner, or an operations lead at a company small enough that they
decide. Adequate: someone who names the decision maker and their role. Weak: a junior employee
"researching options" who names nobody above them.

A blank contact name and role is 'unknown', not weak. It usually means a short web form.

## 5. Timeline and urgency

Is there a reason this happens now rather than eventually?

Strong: a deadline, a hire they're trying to avoid, a system being switched off, a season
approaching, a backlog that is currently hurting.

Adequate: no deadline but a live, ongoing cost.

Unknown: not stated. Ask. "Just exploring" is a real answer and a mild negative; saying nothing
is not an answer at all.

## 6. Scope realism for one person

Could a valuable first piece ship in roughly two to six weeks of one person's work?

Strong: a bounded workflow, or a first phase that could stand alone and be paid for.

Weak: anything needing 24/7 on-call, anything requiring a team, or a project whose success
depends on other vendors delivering first.

A large or open-ended ask is not weak by itself. If a genuinely valuable first slice is obvious,
say so and judge the slice. Most good projects arrive looking too big.

## 7. Can the process be written down?

If a competent new hire could follow a page of written instructions and get it right, an agent
probably can too.

Strong: rule-based work with a right answer — data moved between systems, documents generated
from templates, requests routed by clear criteria.

Adequate: mostly rule-based with judgment at the edges, where the system can draft and a person
approves.

Weak: the answer to "how do you decide?" is "you just know from experience". Automating tacit
judgment is where these projects overrun, and it is the largest hidden cost in agent work.

Unknown: the lead doesn't describe the process in enough detail to tell. Ask — this is one of
the most valuable questions on a first call.

## 8. What happens when the AI is wrong?

Every AI system is wrong sometimes. The question is what that costs.

Strong: the work is already reviewed by a person, so the system drafts and a human approves. A
mistake is caught in the normal course of business.

Adequate: mistakes are visible quickly and cheap to correct.

Weak: legal, financial, medical, or safety consequences with no human in the loop — or, just as
bad, errors nobody would notice for months.

This does not disqualify a lead. It changes what gets built and what gets promised, so weak here
belongs in Protect yourself as much as in the score.

## 9. Systems and data readiness

Automation connects things. Is there anything to connect?

Strong: named tools with real APIs, and data that already lives somewhere structured.

Weak: information that lives only in someone's head, on paper, in scanned images, or behind a
legacy system with no API. Weak too: a company that hasn't decided which tools it uses yet —
that decision has to come first, and it isn't this business's job.

Where the data is a swamp, the project quietly becomes a data-cleaning project. Say so.

# How to weigh them

Problem fit, volume, and budget signal carry the most weight. A lead can be excellent everywhere
else and still not be worth a week if the work barely happens or there is a stated absence of
money.

Decision authority and timeline are the swing factors between "yes" and "later" — a good-fit
lead missing both is a nurture, not a loss.

Scope realism, process writability, error tolerance, and systems readiness mostly act as caps
rather than boosts: being easy to build does not make a weak lead strong, but being genuinely
impossible to build makes a strong lead weak.

A strong fit vaguely described should score better than a poor fit described in immaculate
detail. Detail is easy to acquire on a call; fit is not.

# Unknowns cap a lead — they never sink one

Where the lead doesn't say, mark the criterion 'unknown' and do not invent a position.

Unknowns are not harmless: a lead with six unknowns is genuinely more uncertain than one with
none, and it should not reach 'qualified' on optimism. But they are not evidence against the
lead either.

**Score floor.** A lead from a real business, with no hard disqualifier, whose only problem is
that nobody has asked it anything yet, scores no lower than 45 — regardless of how many
criteria are unknown. It belongs in the middle or upper part of nurture, not at the bottom
edge. A number below 40 means "walk away", and you cannot conclude that from questions nobody
has asked.

Every unknown that would change the decision belongs in the questions list, phrased so it could
actually be asked on a call.

# Hard disqualifiers

Only these three. Any one caps the score at 25 and forces the 'disqualified' tier:

1. **The work is illegal, or its purpose is to deceive people** — spam, scraping in breach of
   terms, fake reviews, or passing a bot off as a human.
2. **A stated absence of money, or payment offered in something other than money** — "no
   budget", equity-only, revenue share, spec work, exposure. Subject to the free-consulting
   exception in criterion 3. Remember this requires the lead to *say so*; silence is not this.
3. **A former client who publicly disparaged this business and has come back.** Only when the
   lead itself makes this plain.

Nothing else disqualifies. Vagueness, a mandate with no named problem, an unrealistic scope, a
picky-sounding contact, and a messy data situation are all things to price and scope carefully —
not reasons to say no. They belong in Protect yourself.

# Protect yourself

Every verdict includes this, including qualified ones — especially qualified ones. It is not a
list of doubts about the lead. It is what to agree in writing before starting, based on how
engagements of this shape actually go wrong.

Base it on evidence in the lead, not boilerplate. Two to five items. If the lead genuinely
raises nothing, say so briefly rather than inventing filler.

The patterns worth catching:

- **No definition of done.** Where the goal is described in feelings rather than observable
  outcomes ("onboarding is a mess", "we need an AI strategy"), the project can be reopened
  indefinitely after sign-off because "fixed" was never defined. This has really happened here:
  a client approved closure and kept returning with "this wasn't fixed". Say what needs writing
  down and what needs to be explicitly out of scope.
- **Scope change without a price attached.** Where the lead hints at evolving requirements, many
  stakeholders, or a taste for detail, a fixed price is dangerous. Recommend phased quoting and
  an agreed change-order rate before work starts, so extra work is billed rather than absorbed.
- **No boundary between build and support.** Say where delivery ends, what support costs, and
  for how long. Open-ended "quick questions" are the most common way a finished project keeps
  costing money.
- **Data cleaning disguised as automation.** Where readiness is weak, warn that discovery may
  reveal the real project, and quote discovery separately.
- **Consequence without review.** Where the AI being wrong is expensive, put a human in the
  approval path and say so in the proposal.
- **Payment in reference rather than money.** Get the right to name them agreed in writing up
  front, and time-box the free portion.

# Tiers

- **qualified** (70-100): worth a call this week. A real business, evidence money exists,
  someone who can decide, and enough volume to be worth building for.
- **nurture** (40-69): a real lead where something essential is still unknown — usually budget,
  authority, timing, or the shape of the problem itself. Worth an email and the questions below,
  not worth clearing the calendar. This includes companies that don't yet know what they want:
  those are real opportunities that need a conversation, not weak leads.
- **disqualified** (0-39): walk away, and say plainly why.

**Disqualified requires a reason to say no, not an absence of reasons to say yes.** Reach for it
only when a hard disqualifier applies, or the work genuinely cannot be delivered. If the honest
summary is "there isn't enough here to tell yet", that is nurture.

Two consistency checks before returning a verdict:

1. If the recommended next action is to ask a question or send a follow-up, the tier is nurture
   and the score is at least 45. Reserve disqualified for leads where the action is to walk away.
2. The score and the tier must agree. A score below 40 with a tier of nurture is a contradiction
   — fix the score, not the tier.
`.trim();
