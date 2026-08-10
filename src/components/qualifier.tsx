"use client";

import { useEffect, useRef, useState } from "react";
import type { Lead, RunPhase, Verdict } from "@/lib/types";
import { LeadForm } from "./lead-form";
import { VerdictCard } from "./verdict-card";
import { WaitingState } from "./waiting-state";
import { FAKE_RUN_ORDER, PREVIEW_VERDICTS } from "./preview-fixtures";

/**
 * Holds which of the three states is on screen. Everything it renders takes
 * plain props, so stage 04 replaces the middle of this file and nothing else.
 */

type State =
  | { status: "idle" }
  | { status: "running"; phase: RunPhase }
  | { status: "done"; verdict: Verdict };

export function Qualifier({ preview }: { preview?: Verdict }) {
  const [state, setState] = useState<State>(
    preview ? { status: "done", verdict: preview } : { status: "idle" },
  );

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const runCount = useRef(0);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // --- STAGE 03 SCAFFOLDING --------------------------------------------
  // Nothing here talks to Trigger.dev. It fakes the timing so the waiting
  // state and the verdict card can be judged before the wiring exists.
  // Stage 04 replaces this function with a server action plus useRealtimeRun,
  // and `preview-fixtures.ts` gets deleted.
  function handleSubmit(_lead: Lead) {
    const key = FAKE_RUN_ORDER[runCount.current % FAKE_RUN_ORDER.length];
    runCount.current += 1;

    setState({ status: "running", phase: "validating" });

    timers.current.push(
      setTimeout(() => setState({ status: "running", phase: "scoring" }), 900),
      setTimeout(
        () => setState({ status: "done", verdict: PREVIEW_VERDICTS[key] }),
        3200,
      ),
    );
  }
  // --- END STAGE 03 SCAFFOLDING ----------------------------------------

  if (state.status === "running") {
    return <WaitingState phase={state.phase} />;
  }

  if (state.status === "done") {
    return (
      <div className="space-y-3">
        <VerdictCard verdict={state.verdict} />
        <button
          type="button"
          onClick={() => setState({ status: "idle" })}
          className="rounded-control border border-line px-5 py-2.5 text-sm font-medium transition-colors duration-200 ease-out hover:border-ink-3 hover:bg-panel"
        >
          Score another lead
        </button>
      </div>
    );
  }

  return <LeadForm onSubmit={handleSubmit} busy={false} />;
}
