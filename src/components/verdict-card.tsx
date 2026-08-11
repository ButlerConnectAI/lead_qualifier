import type { Criterion, Tier, Verdict } from "@/lib/types";
import { Panel, Pill, SolidPanel } from "./panel";

/**
 * The verdict, rendered from a plain object. No data fetching, no run state —
 * so the history page can hand it a saved verdict without touching this file.
 *
 * Read top to bottom it is an assessment: the score, then what to ask, then
 * what to nail down, then the reasoning, then the one thing to do next. The
 * questions and the terms come before the scoring breakdown deliberately —
 * those are what Jake acts on, the breakdown is only there to be checked.
 *
 * The score is set against a 0–100 track with the tier bands marked on it,
 * because a bare number can't tell you that 71 is barely qualified. The tier is
 * the only thing on the page allowed to carry colour.
 *
 * Every colour here is a token from globals.css. Nothing in this file names a
 * colour value, so a rebrand is an edit to that one file.
 */

const TIER: Record<
  Tier,
  { label: string; text: string; fill: string; panel: string; edge: string }
> = {
  qualified: {
    label: "Qualified",
    text: "text-qualified",
    fill: "bg-qualified",
    panel: "from-qualified-soft",
    edge: "border-qualified-line",
  },
  nurture: {
    label: "Nurture",
    text: "text-nurture",
    fill: "bg-nurture",
    panel: "from-nurture-soft",
    edge: "border-nurture-line",
  },
  disqualified: {
    label: "Disqualified",
    text: "text-disqualified",
    fill: "bg-disqualified",
    panel: "from-disqualified-soft",
    edge: "border-disqualified-line",
  },
};

const CRITERION_TONE: Record<Criterion["verdict"], "qualified" | "nurture" | "disqualified" | "neutral"> =
  {
    strong: "qualified",
    adequate: "nurture",
    weak: "disqualified",
    unknown: "neutral",
  };

/** Where nurture starts and where qualified starts, as read from the rubric. */
const BANDS = [40, 70];

export function VerdictCard({ verdict }: { verdict: Verdict }) {
  const tier = TIER[verdict.tier];

  return (
    <div className="animate-rise space-y-4">
      <section
        className={`overflow-hidden rounded-panel border ${tier.edge} bg-gradient-to-b ${tier.panel} to-surface shadow-raised`}
      >
        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Pill tone={verdict.tier}>{tier.label}</Pill>
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-3">
              Predicted fit
            </span>
          </div>

          <div className="mt-5 flex items-end gap-x-2.5">
            <span className="font-display text-[4.5rem] font-semibold leading-[0.8] tracking-[-0.05em] tabular-nums sm:text-[5.5rem]">
              {verdict.score}
            </span>
            <span className="pb-1.5 font-mono text-sm text-ink-3">/100</span>
          </div>

          <ScoreTrack score={verdict.score} fill={tier.fill} />

          {/* The one sentence he'd read out loud. It gets the largest type on
              the page after the score, which is the order he reads them in. */}
          <p className="mt-6 max-w-[46ch] font-display text-[1.5rem] font-semibold leading-[1.2] tracking-[-0.03em] sm:text-[1.875rem]">
            {verdict.headline}
          </p>
        </div>
      </section>

      {/* The two act-on-it lists sit side by side: they're read together when
          preparing for the call, not one after the other. */}
      <div className="grid gap-4 lg:grid-cols-2">
        {verdict.missingInfo.length > 0 && (
          <Panel
            title="Ask before committing"
            caption="Your question list for the call, built from what they didn't say."
          >
            <ul className="space-y-3">
              {verdict.missingInfo.map((question, index) => (
                <li key={index} className="flex gap-2.5 text-[0.9375rem] leading-relaxed">
                  <svg
                    aria-hidden
                    viewBox="0 0 16 16"
                    className="mt-[0.3rem] size-3.5 shrink-0 text-ink-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  >
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                  <span>{question}</span>
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
            <ol className="space-y-3">
              {verdict.protectYourself.map((term, index) => (
                <li key={index} className="flex gap-2.5 text-[0.9375rem] leading-relaxed">
                  <span
                    aria-hidden
                    className="mt-0.5 flex size-[1.125rem] shrink-0 items-center justify-center rounded-[0.3rem] bg-surface-2 font-mono text-[0.6875rem] text-ink-2"
                  >
                    {index + 1}
                  </span>
                  <span>{term}</span>
                </li>
              ))}
            </ol>
          </Panel>
        )}
      </div>

      <Panel title="Biggest risk">
        <p className="max-w-[76ch] text-[0.9375rem] leading-relaxed">{verdict.biggestRisk}</p>
      </Panel>

      <Panel
        title="How it scored"
        caption="Nine criteria, judged separately. A tier can be right for the wrong reasons — this is where you check."
        aside={
          <span className="font-mono text-xs text-ink-3">
            {verdict.criteria.filter((c) => c.verdict === "unknown").length} unknown
          </span>
        }
        padded={false}
      >
        <ul className="divide-y divide-line-soft">
          {verdict.criteria.map((criterion) => (
            <li key={criterion.name} className="px-5 py-3.5 sm:px-6">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-[0.9375rem] font-medium tracking-[-0.01em]">
                  {criterion.name}
                </h3>
                <Pill tone={CRITERION_TONE[criterion.verdict]}>{criterion.verdict}</Pill>
              </div>
              <p className="mt-1 max-w-[76ch] text-[0.9375rem] leading-relaxed text-ink-2">
                {criterion.reason}
              </p>
            </li>
          ))}
        </ul>
      </Panel>

      <SolidPanel label="Next action">
        <p className="font-display text-[1.375rem] font-semibold leading-[1.25] tracking-[-0.025em] sm:text-[1.5rem]">
          {verdict.nextAction}
        </p>
      </SolidPanel>
    </div>
  );
}

/**
 * The score on its 0–100 range, with the two tier boundaries marked.
 *
 * The point is proximity: 71 and 96 are both "qualified" and they are not the
 * same lead. The number alone can't say that; its position on the range can.
 */
function ScoreTrack({ score, fill }: { score: number; fill: string }) {
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <div className="mt-4 max-w-md">
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
        <div
          className={`h-full rounded-full ${fill}`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      <div className="relative mt-1.5 h-4">
        {BANDS.map((band) => (
          <span
            key={band}
            aria-hidden
            className="absolute -translate-x-1/2 font-mono text-[0.625rem] text-ink-3"
            style={{ left: `${band}%` }}
          >
            {band}
          </span>
        ))}
      </div>
    </div>
  );
}
