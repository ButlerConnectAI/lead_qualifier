import Link from "next/link";

import type { HistoryEntry, HistoryStatus } from "@/server/history";
import type { Tier } from "@/lib/types";
import { Pill } from "./panel";

/**
 * Every lead this account has scored, newest first.
 *
 * A table, not a grid of cards: the point of this screen is comparison down a
 * column, and cards break that. Verdict and score sit in fixed columns so
 * running an eye down them gives the shape of the pipeline without reading a
 * word — the same job the tier colour does on a single verdict, at list scale.
 *
 * The score stays in the same treatment it has on the verdict card: black,
 * tabular, never coloured. Colour marks the tier; size marks the score.
 */

const UNSCORED: Record<Exclude<HistoryStatus, "complete">, string> = {
  pending: "Scoring…",
  failed: "Didn't finish",
  abandoned: "Result expired",
};

const TIER_LABEL: Record<Tier, string> = {
  qualified: "Qualified",
  nurture: "Nurture",
  disqualified: "Disqualified",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ROW = "grid gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_7.5rem_3.5rem_6.5rem]";

export function HistoryList({ entries }: { entries: HistoryEntry[] }) {
  return (
    <div className="overflow-hidden rounded-panel border border-line bg-surface shadow-card">
      <div
        className={`${ROW} hidden border-b border-line-soft bg-surface-2 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.06em] text-ink-3 sm:grid sm:px-6`}
      >
        <span>Lead</span>
        <span>Verdict</span>
        <span className="text-right">Score</span>
        <span className="text-right">Scored</span>
      </div>

      <ul className="divide-y divide-line-soft">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              href={`/history/${entry.id}`}
              className={`${ROW} items-baseline px-5 py-3.5 transition-colors duration-150 ease-out hover:bg-surface-2 focus-visible:bg-surface-2 sm:px-6`}
            >
              <span className="min-w-0">
                <span className="block truncate text-[0.9375rem] font-medium tracking-[-0.01em]">
                  {entry.lead.company}
                </span>
                {entry.verdict && (
                  <span className="mt-0.5 block truncate text-sm text-ink-2">
                    {entry.verdict.headline}
                  </span>
                )}
              </span>

              {/* On a phone the four columns collapse into one row of facts, so
                  the score joins the verdict rather than disappearing with the
                  columns it belongs to. */}
              <span className="mt-1.5 flex items-center gap-3 sm:mt-0 sm:block">
                {entry.tier ? (
                  <Pill tone={entry.tier}>{TIER_LABEL[entry.tier]}</Pill>
                ) : (
                  <Pill tone="neutral">
                    {UNSCORED[entry.status as Exclude<HistoryStatus, "complete">]}
                  </Pill>
                )}

                {entry.score !== null && entry.score !== undefined && (
                  <span className="text-sm font-semibold tabular-nums text-ink-2 sm:hidden">
                    {entry.score}
                  </span>
                )}

                <span className="ml-auto font-mono text-xs text-ink-3 sm:hidden">
                  {formatDate(entry.createdAt)}
                </span>
              </span>

              <span className="hidden text-right text-[0.9375rem] font-semibold tabular-nums tracking-[-0.01em] sm:block">
                {entry.score ?? <span className="text-ink-3">—</span>}
              </span>

              <span className="hidden text-right font-mono text-xs text-ink-3 sm:block">
                {formatDate(entry.createdAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
