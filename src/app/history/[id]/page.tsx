import Link from "next/link";
import { notFound } from "next/navigation";

import { LeadSummary } from "@/components/lead-summary";
import { Panel } from "@/components/panel";
import { SiteHeader } from "@/components/site-header";
import { VerdictCard } from "@/components/verdict-card";
import { verifySession } from "@/server/dal";
import { getHistoryEntry } from "@/server/history";

/**
 * One saved run.
 *
 * `getHistoryEntry` reads through the signed-in user's own connection, so
 * row-level security is what decides whether this row is visible. Someone
 * else's id gets the same "not found" as an id that was never real — the page
 * doesn't have to know the difference, and shouldn't reveal it.
 */

const UNFINISHED = {
  pending: {
    title: "Still scoring",
    message:
      "This one hasn't come back yet. Leave the page open a moment — it fills itself in when the scorer finishes.",
  },
  failed: {
    title: "This run didn't finish",
    message:
      "The scorer stopped before it produced a verdict. The lead below is exactly as you entered it, so scoring it again costs nothing but the time.",
  },
  abandoned: {
    title: "The verdict is no longer available",
    message:
      "This run finished while the page was closed and its result has since aged out of the scorer's records. The lead below is intact — score it again to get a fresh verdict.",
  },
} as const;

export default async function HistoryEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await verifySession();
  const { id } = await params;

  const entry = await getHistoryEntry(id);

  if (!entry) notFound();

  const unfinished = entry.status === "complete" ? null : UNFINISHED[entry.status];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader email={user.email} current="history" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12 sm:px-6 sm:py-16">
        <div className="mb-8">
          <Link
            href="/history"
            className="text-sm text-ink-2 transition-colors duration-200 ease-out hover:text-ink"
          >
            ← History
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            {entry.lead.company}
          </h1>
          <p className="mt-2 font-mono text-xs text-ink-3">
            Scored{" "}
            {new Date(entry.createdAt).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="space-y-3">
          {entry.verdict ? (
            <VerdictCard verdict={entry.verdict} />
          ) : (
            unfinished && (
              <Panel title={unfinished.title}>
                <p className="text-[0.9375rem] leading-relaxed text-ink-2">
                  {unfinished.message}
                </p>
              </Panel>
            )
          )}

          <LeadSummary lead={entry.lead} />
        </div>
      </main>
    </div>
  );
}
