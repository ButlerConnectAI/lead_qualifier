import "server-only";

import { LeadSchema, VerdictSchema, type Lead, type Tier, type Verdict } from "@/lib/types";
import { getUser } from "./dal";
import { readRun } from "./run-read";
import { createClient } from "./supabase/server";

/**
 * Saved scoring runs.
 *
 * Every query here runs as the signed-in user, so row-level security is what
 * scopes it — there is no `where user_id = ...` to forget. Insert is the one
 * exception: it has to state the user id so the policy can check it matches.
 *
 * A run is written twice on purpose, mirroring how the page already collects a
 * verdict two ways:
 *
 *   1. `recordRunStarted` on submit, so a row exists before scoring does.
 *   2. `recordRunOutcome` when the page sees the run end — and
 *      `reconcilePending` when nobody was watching, because the tab was closed.
 *
 * Both land on the same row via the unique `run_id`, so running twice is safe.
 *
 * Web-only: the Trigger.dev task never imports this, which is why changing it
 * needs a push but not `npm run deploy:task`.
 */

const TABLE = "lead_runs";

/**
 * After this long, a pending run is retired rather than chased.
 *
 * The task's own ceiling is 180 seconds, so nothing is still legitimately
 * running after a day. Past that, either the verdict was collected or the run
 * has aged out of Trigger.dev's retention and is unrecoverable.
 */
const ABANDON_AFTER_MS = 24 * 60 * 60 * 1000;

/** A cap, so one bad day can't turn the history page into a hundred API calls. */
const RECONCILE_LIMIT = 10;

export type HistoryStatus = "pending" | "complete" | "failed" | "abandoned";

export type HistoryEntry = {
  id: string;
  runId: string;
  lead: Lead;
  verdict: Verdict | null;
  score: number | null;
  tier: Tier | null;
  status: HistoryStatus;
  createdAt: string;
};

type Row = {
  id: string;
  run_id: string;
  lead: unknown;
  verdict: unknown;
  score: number | null;
  tier: string | null;
  status: string;
  created_at: string;
};

const COLUMNS = "id, run_id, lead, verdict, score, tier, status, created_at";

const STATUSES: readonly HistoryStatus[] = ["pending", "complete", "failed", "abandoned"];

/**
 * The database is storage, not the authority on shape. A row was JSON when it
 * went in and could have been written by an older version of the app, so it is
 * parsed rather than trusted — zod stays the one definition of a lead.
 */
function toEntry(row: Row): HistoryEntry | null {
  const lead = LeadSchema.safeParse(row.lead);
  if (!lead.success) return null;

  const verdict = row.verdict ? VerdictSchema.safeParse(row.verdict) : null;

  return {
    id: row.id,
    runId: row.run_id,
    lead: lead.data,
    verdict: verdict?.success ? verdict.data : null,
    score: row.score,
    tier: (row.tier as Tier | null) ?? null,
    status: STATUSES.includes(row.status as HistoryStatus)
      ? (row.status as HistoryStatus)
      : "pending",
    createdAt: row.created_at,
  };
}

/**
 * Record that a run has started. Reports whether it worked.
 *
 * The caller treats failure as fatal, which looks harsh for a history write.
 * The reason is `ownsRun` below: the page's polling fallback is allowed to
 * answer only for runs the caller owns, and ownership is decided by this row
 * existing. A run with no row would be one the fallback can never answer for —
 * so if the realtime subscription also went quiet, a paid verdict would be
 * stranded with no way to collect it. Better to not start than to start
 * something that can't be finished.
 */
export async function recordRunStarted(runId: string, lead: Lead): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;

  const supabase = await createClient();

  const { error } = await supabase.from(TABLE).insert({
    user_id: user.id,
    run_id: runId,
    lead,
    status: "pending",
  });

  if (error) {
    console.error("recordRunStarted: could not save run", runId, error.message);
    return false;
  }

  return true;
}

/**
 * Whether this run belongs to the signed-in user.
 *
 * RLS is what makes the answer honest: the query physically cannot see another
 * user's row, so this isn't an application-level check that could be written
 * wrong. It does mean "not yours" and "doesn't exist" are indistinguishable,
 * which is why `recordRunStarted` failing has to stop the run.
 */
export async function ownsRun(runId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id")
    .eq("run_id", runId)
    .maybeSingle();

  return !error && data !== null;
}

/**
 * Write down how a run ended.
 *
 * Takes only a run id and re-reads the result from Trigger.dev server-side. A
 * verdict sent from the browser is never trusted — this is a public endpoint's
 * worth of trust, and the browser could say anything.
 *
 * Does nothing if the run hasn't actually finished. That matters because the
 * page calls this from its give-up paths too ("took too long", "couldn't get
 * the result back"), where the run may well still be going.
 */
export async function recordRunOutcome(runId: string): Promise<void> {
  const snapshot = await readRun(runId);

  if (snapshot.state === "done") {
    await finish(runId, {
      verdict: snapshot.verdict,
      score: snapshot.verdict.score,
      tier: snapshot.verdict.tier,
      status: "complete",
    });
    return;
  }

  if (snapshot.state === "failed" || snapshot.state === "malformed") {
    await finish(runId, { status: "failed" });
  }

  // "pending" is still running and "unreachable" is a bad moment to conclude
  // anything. Both get left alone and looked at again later.
}

async function finish(
  runId: string,
  fields: Record<string, unknown> & { status: HistoryStatus },
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from(TABLE)
    .update({ ...fields, completed_at: new Date().toISOString() })
    .eq("run_id", runId);

  if (error) console.error("history: could not record outcome", runId, error.message);
}

/**
 * Catch up runs that ended while nobody was watching.
 *
 * The page records its own outcome the moment it sees one, so this normally
 * finds nothing. It exists for the run that was still going when the tab was
 * closed — without it that row would say "scoring" forever.
 */
export async function reconcilePending(): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("run_id, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(RECONCILE_LIMIT);

  if (error || !data?.length) return;

  const cutoff = Date.now() - ABANDON_AFTER_MS;

  await Promise.all(
    data.map(async ({ run_id, created_at }) => {
      if (new Date(created_at).getTime() < cutoff) {
        await finish(run_id, { status: "abandoned" });
        return;
      }

      await recordRunOutcome(run_id);
    }),
  );
}

export async function listHistory(): Promise<HistoryEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("listHistory: could not read history", error.message);
    return [];
  }

  return (data as Row[]).map(toEntry).filter((entry): entry is HistoryEntry => entry !== null);
}

export async function getHistoryEntry(id: string): Promise<HistoryEntry | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.from(TABLE).select(COLUMNS).eq("id", id).maybeSingle();

  if (error || !data) return null;

  return toEntry(data as Row);
}
