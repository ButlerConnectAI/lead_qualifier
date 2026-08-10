"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

import { startQualifyRun } from "@/app/actions";
import { VerdictSchema, type Lead, type RunPhase, type Verdict } from "@/lib/types";
import type { qualifyLeadTask } from "@/trigger/qualify-lead";
import { ErrorNotice } from "./error-notice";
import { LeadForm, type LeadFormValues } from "./lead-form";
import { VerdictCard } from "./verdict-card";
import { WaitingState } from "./waiting-state";

/**
 * Holds which state is on screen, and owns the one round trip to the server.
 *
 * The server action starts the run and returns immediately; everything after
 * that arrives over a direct subscription to Trigger.dev. Nothing in this file
 * waits on Claude, and no Trigger.dev credential reaches it beyond the token
 * scoped to the single run being watched.
 *
 * Every path out of "running" ends in a verdict or a message. A spinner is
 * never the last thing on screen — see RunWatcher.
 */

type State =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "running"; runId: string; accessToken: string }
  | { status: "done"; verdict: Verdict }
  | { status: "error"; title: string; message: string };

export function Qualifier() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [typed, setTyped] = useState<LeadFormValues>();

  async function handleSubmit(lead: Lead, raw: LeadFormValues) {
    setTyped(raw);
    setState({ status: "starting" });

    let result;
    try {
      result = await startQualifyRun(lead);
    } catch {
      // The action itself failed to reach the server — offline, or a deploy
      // swapped underneath an open tab.
      setState({
        status: "error",
        title: "Couldn't reach the server",
        message:
          "The request didn't get through. Check your connection and score the lead again — nothing was charged and no run was started.",
      });
      return;
    }

    if (!result.ok) {
      setState({
        status: "error",
        title: "Couldn't start the scorer",
        message: result.message,
      });
      return;
    }

    setState({
      status: "running",
      runId: result.runId,
      accessToken: result.publicAccessToken,
    });
  }

  const handleComplete = useCallback((verdict: Verdict) => {
    setState({ status: "done", verdict });
  }, []);

  const handleFailure = useCallback((title: string, message: string) => {
    setState({ status: "error", title, message });
  }, []);

  if (state.status === "starting") {
    return <WaitingState phase="validating" />;
  }

  if (state.status === "running") {
    return (
      <RunWatcher
        runId={state.runId}
        accessToken={state.accessToken}
        onComplete={handleComplete}
        onFailure={handleFailure}
      />
    );
  }

  if (state.status === "done") {
    return (
      <div className="space-y-3">
        <VerdictCard verdict={state.verdict} />
        <button
          type="button"
          onClick={() => {
            setTyped(undefined);
            setState({ status: "idle" });
          }}
          className="rounded-control border border-line px-5 py-2.5 text-sm font-medium transition-colors duration-200 ease-out hover:border-ink-3 hover:bg-panel"
        >
          Score another lead
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {state.status === "error" && (
        <ErrorNotice title={state.title} message={state.message} />
      )}
      <LeadForm onSubmit={handleSubmit} busy={false} defaultValues={typed} />
    </div>
  );
}

// --- Watching a live run ------------------------------------------------

const FAILED_STATUSES = [
  "FAILED",
  "CRASHED",
  "SYSTEM_FAILURE",
  "CANCELED",
  "EXPIRED",
  "TIMED_OUT",
] as const;

/**
 * A run sits in PENDING_VERSION when no worker can pick it up — locally, that
 * means `npm run dev:task` isn't running. It would otherwise wait indefinitely,
 * so it gets a few seconds' grace and then says so.
 */
const NO_WORKER_AFTER_MS = 8_000;

/** Aligned to the task's own maxDuration (180s) so a slow run is never cut off early. */
const STALLED_AFTER_MS = 200_000;

function RunWatcher({
  runId,
  accessToken,
  onComplete,
  onFailure,
}: {
  runId: string;
  accessToken: string;
  onComplete: (verdict: Verdict) => void;
  onFailure: (title: string, message: string) => void;
}) {
  const { run, error } = useRealtimeRun<typeof qualifyLeadTask>(runId, { accessToken });

  const status = run?.status;

  // Read by the timers below, which fire long after the render that set it.
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // The subscription dropped, or the run's 15-minute token expired. Either way
  // the page can no longer tell what happened, which is worth saying plainly.
  useEffect(() => {
    if (!error) return;

    onFailure(
      "Lost contact with the run",
      "The live connection to the scorer dropped, or this run's access window expired. The run may still have finished — it'll be in the Trigger.dev dashboard. Scoring the lead again is safe.",
    );
  }, [error, onFailure]);

  useEffect(() => {
    if (!run) return;

    if ((FAILED_STATUSES as readonly string[]).includes(run.status)) {
      onFailure(
        "The scoring run failed",
        "The run started but didn't finish. The usual cause is the Anthropic key missing from the Trigger.dev dashboard — check both DEV and PROD. The full trace is in the dashboard under this run.",
      );
      return;
    }

    if (run.status !== "COMPLETED") return;

    // The deployed task could be an older version returning an older shape, so
    // the output is checked rather than trusted.
    const parsed = VerdictSchema.safeParse(run.output);

    if (!parsed.success) {
      onFailure(
        "The verdict didn't arrive in one piece",
        "The run finished but the result wasn't in the expected shape. If the scorer was deployed recently, run `npm run deploy:task` so the live task matches the current criteria.",
      );
      return;
    }

    onComplete(parsed.data);
  }, [run, onComplete, onFailure]);

  useEffect(() => {
    const noWorker = setTimeout(() => {
      if (statusRef.current !== "PENDING_VERSION") return;

      onFailure(
        "The scorer isn't running",
        "The lead was accepted but nothing picked it up. Start `npm run dev:task` in a second terminal, wait for `Local worker ready`, then score the lead again.",
      );
    }, NO_WORKER_AFTER_MS);

    const stalled = setTimeout(() => {
      if (statusRef.current === "COMPLETED") return;

      onFailure(
        "The run took too long",
        "Scoring usually takes 15–25 seconds and this one didn't come back. Check the Trigger.dev dashboard for what it was doing, then try again.",
      );
    }, STALLED_AFTER_MS);

    return () => {
      clearTimeout(noWorker);
      clearTimeout(stalled);
    };
  }, [onFailure]);

  const reported = run?.metadata?.phase as RunPhase | undefined;

  // "done" arrives a moment before the run itself completes; showing it would
  // flash a finished state at a page that has no verdict to render yet.
  const phase: RunPhase = reported === "done" ? "scoring" : (reported ?? "validating");

  return <WaitingState phase={phase} />;
}
