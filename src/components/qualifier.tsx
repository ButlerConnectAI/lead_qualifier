"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

import {
  fetchRunSnapshot,
  recordOutcome,
  startQualifyRun,
  type RunSnapshot,
} from "@/app/actions";
import { isFailedRunStatus, VerdictSchema, type Lead, type RunPhase, type Verdict } from "@/lib/types";
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
      <div className="space-y-4">
        <VerdictCard verdict={state.verdict} />
        <button
          type="button"
          onClick={() => {
            setTyped(undefined);
            setState({ status: "idle" });
          }}
          className="rounded-control border border-line bg-surface px-5 py-2.5 text-sm font-medium shadow-card transition-colors duration-150 ease-out hover:border-ink-3 hover:bg-surface-2"
        >
          Score another lead
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {state.status === "error" && (
        <ErrorNotice title={state.title} message={state.message} />
      )}
      <LeadForm onSubmit={handleSubmit} busy={false} defaultValues={typed} />
    </div>
  );
}

// --- Watching a live run ------------------------------------------------

/**
 * A run sits in PENDING_VERSION when no worker can pick it up — locally, that
 * means `npm run dev:task` isn't running. It would otherwise wait indefinitely,
 * so it gets a few seconds' grace and then says so.
 */
const NO_WORKER_AFTER_MS = 12_000;

/** Aligned to the task's own maxDuration (180s) so a slow run is never cut off early. */
const STALLED_AFTER_MS = 200_000;

/**
 * A shorter deadline for the case where *neither* route has managed to read the
 * run even once. That isn't a slow run, it's a page that can't hear anything,
 * and there's no sense making someone watch a spinner for another two and a
 * half minutes to be told so.
 */
const SILENT_AFTER_MS = 45_000;

/** How often the page asks the server whether the run has finished. */
const POLL_EVERY_MS = 3_000;

// Both routes to the finish line say the same thing, so they're written once.
const FAILURES = {
  runFailed: [
    "The scoring run failed",
    "The run started but didn't finish. The full trace is in your run history under this run.",
  ],
  badShape: [
    "The verdict didn't arrive in one piece",
    "The run finished but the result wasn't in the expected shape. If the scorer was deployed recently, run `npm run deploy:task` so the live task matches the current criteria.",
  ],
  noWorker: [
    "The scorer isn't running",
    "The lead was accepted but nothing picked it up. Start `npm run dev:task` in a second terminal, wait for `Local worker ready`, then score the lead again.",
  ],
  tooLong: [
    "The run took too long",
    "Scoring usually takes 15–25 seconds and this one didn't come back. It'll be in your run history if you want to see what it was doing. Try again.",
  ],
  outOfTouch: [
    "Couldn't get the result back",
    "The scoring may well have finished — the page just couldn't collect it, and both ways of asking went quiet. The verdict will be in your run history. Scoring again is safe.",
  ],
} as const satisfies Record<string, readonly [string, string]>;

/**
 * Watches one run, two independent ways.
 *
 * The live subscription is the fast path and drives the progress text. But it
 * can go silent without raising an error — a buffering proxy or a blocking
 * browser extension both look exactly like a run that never ends — and the
 * page used to sit there until it timed out and blamed the scorer for
 * something the scorer had already done. So the server is polled in parallel
 * over the same ordinary connection that served the page.
 *
 * Whichever gets to a terminal state first wins; `settled` makes sure the
 * loser is ignored. A spinner is still never the last thing on screen.
 */
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
  const [snapshot, setSnapshot] = useState<RunSnapshot>();

  const settled = useRef(false);

  // Saving the outcome hangs off `settled`, which already guarantees exactly
  // once. It's deliberately not awaited: a history write must never be able to
  // keep a verdict off the screen. The server re-reads the run rather than
  // believing anything sent from here, and does nothing if the run is still
  // going — which is why the give-up paths below can call it too.
  const record = useCallback(() => {
    void recordOutcome(runId).catch(() => {});
  }, [runId]);

  const complete = useCallback(
    (verdict: Verdict) => {
      if (settled.current) return;
      settled.current = true;
      record();
      onComplete(verdict);
    },
    [onComplete, record],
  );

  const fail = useCallback(
    ([title, message]: readonly [string, string]) => {
      if (settled.current) return;
      settled.current = true;
      record();
      onFailure(title, message);
    },
    [onFailure, record],
  );

  // Read by the timers below, which fire long after the render that set them.
  const liveStatus = run?.status;
  const stateRef = useRef({ liveStatus, snapshot });
  useEffect(() => {
    stateRef.current = { liveStatus, snapshot };
  }, [liveStatus, snapshot]);

  // Whether each route has ever successfully told us anything about this run.
  // Silence from both is a different failure from a run that is genuinely slow,
  // and they deserve different messages and different deadlines.
  const heard = useRef({ live: false, server: false });

  // A dropped subscription is no longer fatal — the poll below can still
  // collect the verdict — but it's worth leaving a trace, because a silent
  // realtime failure is exactly what made this hard to diagnose the first time.
  useEffect(() => {
    if (error) console.warn("realtime subscription failed; falling back to polling", error);
  }, [error]);

  // The live subscription: the fast path, and what drives the progress text.
  useEffect(() => {
    if (!run) return;
    heard.current.live = true;

    if (isFailedRunStatus(run.status)) {
      fail(FAILURES.runFailed);
      return;
    }

    if (run.status !== "COMPLETED") return;

    // The deployed task could be an older version returning an older shape, so
    // the output is checked rather than trusted.
    const parsed = VerdictSchema.safeParse(run.output);

    if (!parsed.success) {
      fail(FAILURES.badShape);
      return;
    }

    complete(parsed.data);
  }, [run, complete, fail]);

  // The fallback. Asks the server directly, so it doesn't depend on the
  // browser being able to reach Trigger.dev at all.
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    async function poll() {
      if (cancelled || inFlight || settled.current) return;
      inFlight = true;

      try {
        const result = await fetchRunSnapshot(runId);
        if (cancelled) return;

        if (result.state !== "unreachable") heard.current.server = true;
        setSnapshot(result);

        if (result.state === "done") complete(result.verdict);
        else if (result.state === "failed") fail(FAILURES.runFailed);
        else if (result.state === "malformed") fail(FAILURES.badShape);
      } catch {
        // Offline, or the action didn't get through. The next tick retries;
        // the give-up timer below is what eventually calls it.
      } finally {
        inFlight = false;
      }
    }

    const ticker = setInterval(poll, POLL_EVERY_MS);

    return () => {
      cancelled = true;
      clearInterval(ticker);
    };
  }, [runId, complete, fail]);

  useEffect(() => {
    const noWorker = setTimeout(() => {
      const { liveStatus: live, snapshot: snap } = stateRef.current;

      // Trust whichever source actually said something. Only claim nothing
      // picked the lead up when one of them positively reports that.
      const stuck = live === "PENDING_VERSION" || (snap?.state === "pending" && snap.awaitingWorker);

      if (stuck) fail(FAILURES.noWorker);
    }, NO_WORKER_AFTER_MS);

    // Neither route has said anything at all. Don't sit on it, and don't blame
    // a scorer that may have finished long ago.
    const silent = setTimeout(() => {
      if (heard.current.live || heard.current.server) return;

      fail(FAILURES.outOfTouch);
    }, SILENT_AFTER_MS);

    const stalled = setTimeout(() => {
      const heardAnything = heard.current.live || heard.current.server;

      fail(heardAnything ? FAILURES.tooLong : FAILURES.outOfTouch);
    }, STALLED_AFTER_MS);

    return () => {
      clearTimeout(noWorker);
      clearTimeout(silent);
      clearTimeout(stalled);
    };
  }, [fail]);

  const reported =
    (run?.metadata?.phase as RunPhase | undefined) ??
    (snapshot?.state === "pending" ? (snapshot.phase ?? undefined) : undefined);

  // "done" arrives a moment before the run itself completes; showing it would
  // flash a finished state at a page that has no verdict to render yet.
  const phase: RunPhase = reported === "done" ? "scoring" : (reported ?? "validating");

  return <WaitingState phase={phase} />;
}
