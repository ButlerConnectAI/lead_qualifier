# 03 — Build the form and result UI

## Goal

The form and the verdict card, both rendering correctly, driven by fake data. Nothing is wired to
Trigger.dev yet — that's stage 04, and keeping them separate means a broken layout can't be
mistaken for a broken connection.

## Steps

1. **Build the form** in `src/app/page.tsx` from the lead shape in `src/lib/types.ts`. Fields in
   the order Jake would naturally learn them: company, ask, then the optional context.

   - Only `company` and `ask` are required. Everything else submits blank without complaint.
   - Validate with the same zod schema the task uses. No second definition of what's valid.
   - `budgetSignal` and `timeline` are free text, not dropdowns — "said they've got budget
     approved for Q3" carries more signal than a band, and the model reads it fine.
   - Disable the submit button while a run is in flight.

2. **Build the verdict card** as its own component taking a verdict object as a prop. Score and
   tier prominent and colour-coded by tier, headline underneath, then the criteria breakdown,
   biggest risk, missing info, and recommended next action.

   `missingInfo` is the most actionable part of the output — it's the list of questions to ask on
   the call. Give it real visual weight rather than burying it at the bottom.

3. **Build the waiting state** as its own component too, taking a status string. It needs to show
   *something specific* while the run is in flight — the phase labels the task writes to metadata,
   not a bare spinner.

4. **Render all three states from a hardcoded fixture** while building: idle, running, and each
   of the three verdict tiers. Check them at phone width as well as desktop.

## Done-test

`npm run dev`, then in the browser:

- Submitting with an empty company name shows a validation error and does not submit.
- Filling both required fields and leaving the rest blank submits cleanly.
- All three tiers render legibly, as does a verdict with an empty `missingInfo` array.
- Nothing overflows horizontally at phone width.

## Notes

- No `use client` on `page.tsx` as a whole if it can be avoided — keep the interactive form as a
  client component and leave the page a server component.
- Don't import anything from `src/trigger/` here. `import type` from `src/lib/types.ts` only.
- Resist styling ambition. A clear card beats a designed one, and stage 04 is where the real
  surprises are.
