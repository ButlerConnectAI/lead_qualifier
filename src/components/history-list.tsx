import Link from "next/link";

import type { HistoryEntry, HistoryStatus } from "@/server/history";
import type { Tier } from "@/lib/types";

/**
 * Every lead this account has scored, newest first.
 *
 * A ledger, not a grid of cards. Rows are separated by a hairline and the only
 * colour is the tier dot, held in a fixed left column — so running your eye
 * down that column gives you the shape of the pipeline without reading a word.
 * That's the same trick the verdict card plays with its one coloured stripe,
 * applied at list scale rather than a new device invented for this screen.
 *
 * The score sits in the same treatment it has on the verdict card: black,
 * tabular, never coloured. Colour marks the tier; size marks the score.
 */

const TIER_DOT: Record<Tier, string> = {
  qualified: "bg-qualified",
  nurture: "bg-nurture",
  disqualified: "bg-disqualified",
};

const UNSCORED: Record<Exclude<HistoryStatus, "complete">, string> = {
  pending: "Scoring…",
  failed: "Didn't finish",
  abandoned: "Result expired",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function HistoryList({ entries }: { entries: HistoryEntry[] }) {
  return (
    <ul className="divide-y divide-line-soft border-y border-line-soft">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Link
            href={`/history/${entry.id}`}
            className="grid grid-cols-[0.5rem_2.75rem_minmax(0,1fr)] items-baseline gap-x-3 py-4 transition-colors duration-200 ease-out hover:bg-panel focus-visible:bg-panel sm:gap-x-4"
          >
            <span
              aria-hidden
              className={`mt-2 size-1.5 rounded-full ${
                entry.tier ? TIER_DOT[entry.tier] : "bg-ink-3/40"
              }`}
            />

            <span className="text-lg font-semibold tabular-nums tracking-tight">
              {entry.score ?? <span className="text-ink-3">—</span>}
            </span>

            <span className="min-w-0">
              <span className="flex flex-wrap items-baseline gap-x-3">
                <span className="truncate text-[0.9375rem] font-medium tracking-tight">
                  {entry.lead.company}
                </span>
                <span className="ml-auto shrink-0 font-mono text-xs text-ink-3">
                  {formatDate(entry.createdAt)}
                </span>
              </span>

              <span className="mt-1 block truncate text-sm text-ink-2">
                {entry.status === "complete" && entry.verdict
                  ? entry.verdict.headline
                  : UNSCORED[entry.status as Exclude<HistoryStatus, "complete">]}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
