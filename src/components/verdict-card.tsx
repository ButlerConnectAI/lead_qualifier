import type { Criterion, Tier, Verdict } from "@/lib/types";
import { Panel, SolidPanel } from "./panel";

/**
 * The verdict, rendered from a plain object. No data fetching, no run state —
 * so stage 04 can hand it a real verdict without touching this file.
 *
 * Read top to bottom it is an assessment: the score, then what to ask, then
 * what to nail down, then the reasoning, then the one thing to do next. The
 * questions and the terms come before the scoring breakdown deliberately —
 * those are what Jake acts on, the breakdown is only there to be checked.
 *
 * Every colour here is a token from globals.css. Nothing in this file names a
 * colour value, so a rebrand is an edit to that one file.
 */

const TIER_STYLES: Record<Tier, { label: string; text: string; bar: string; dot: string }> = {
  qualified: {
    label: "Qualified",
    text: "text-qualified",
    bar: "bg-qualified",
    dot: "bg-qualified",
  },
  nurture: {
    label: "Nurture",
    text: "text-nurture",
    bar: "bg-nurture",
    dot: "bg-nurture",
  },
  disqualified: {
    label: "Disqualified",
    text: "text-disqualified",
    bar: "bg-disqualified",
    dot: "bg-disqualified",
  },
};

const CRITERION_STYLES: Record<Criterion["verdict"], string> = {
  strong: "text-qualified",
  adequate: "text-nurture",
  weak: "text-disqualified",
  unknown: "text-ink-3",
};

export function VerdictCard({ verdict }: { verdict: Verdict }) {
  const tier = TIER_STYLES[verdict.tier];

  return (
    <div className="space-y-3">
      {/*
        The one coloured stroke on the page. Everything else is grey, so a 3px
        rule is enough to read the tier from across the room — which is why the
        score itself stays black and the chip stays quiet.
      */}
      <section className="overflow-hidden rounded-panel border border-line bg-panel">
        <div aria-hidden className={`h-[3px] w-full ${tier.bar}`} />

        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <p className="text-[3.25rem] font-semibold leading-none tracking-[-0.045em] tabular-nums sm:text-6xl">
              {verdict.score}
            </p>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1">
              <span aria-hidden className={`size-1.5 rounded-full ${tier.dot}`} />
              <span className={`text-xs font-medium ${tier.text}`}>{tier.label}</span>
            </span>
          </div>

          <p className="mt-5 max-w-[46ch] text-xl font-medium leading-snug tracking-tight sm:text-[1.375rem]">
            {verdict.headline}
          </p>
        </div>
      </section>

      {verdict.missingInfo.length > 0 && (
        <Panel title="Ask before committing">
          <ul className="divide-y divide-line-soft">
            {verdict.missingInfo.map((question, index) => (
              <li
                key={index}
                className="py-3 text-[0.9375rem] leading-relaxed first:pt-0 last:pb-0"
              >
                {question}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {verdict.protectYourself.length > 0 && (
        <Panel
          title="Protect yourself"
          caption="Agree these in writing before starting — including on a good lead."
        >
          {/* Numbered because these are clauses you refer back to, not steps. */}
          <ol className="divide-y divide-line-soft">
            {verdict.protectYourself.map((term, index) => (
              <li
                key={index}
                className="grid grid-cols-[1.5rem_minmax(0,1fr)] py-3 text-[0.9375rem] leading-relaxed first:pt-0 last:pb-0"
              >
                <span aria-hidden className="pt-px font-mono text-xs text-ink-3">
                  {index + 1}
                </span>
                <span>{term}</span>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      <Panel title="Biggest risk">
        <p className="text-[0.9375rem] leading-relaxed">{verdict.biggestRisk}</p>
      </Panel>

      <Panel title="How it scored">
        <ul className="divide-y divide-line-soft">
          {verdict.criteria.map((criterion) => (
            <li key={criterion.name} className="py-3.5 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <h3 className="text-[0.9375rem] font-medium tracking-tight">{criterion.name}</h3>
                <span
                  className={`text-xs font-medium ${CRITERION_STYLES[criterion.verdict]}`}
                >
                  {criterion.verdict}
                </span>
              </div>
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-2">
                {criterion.reason}
              </p>
            </li>
          ))}
        </ul>
      </Panel>

      <SolidPanel label="Next action">
        <p className="text-lg font-medium leading-snug tracking-tight">{verdict.nextAction}</p>
      </SolidPanel>
    </div>
  );
}
