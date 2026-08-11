import { RUN_PHASES, type RunPhase } from "@/lib/types";
import { Panel } from "./panel";

/**
 * Shown while a run is in flight.
 *
 * Deliberately not a bare spinner: the task writes a phase to run metadata, so
 * this can say which step is happening. A scoring run takes long enough that
 * "something is happening" is not reassurance on its own.
 *
 * The track is indeterminate on purpose — the run has no percentage to report,
 * and a bar that pretends otherwise is a lie about how long is left.
 */

const ORDER: RunPhase[] = ["validating", "scoring"];

export function WaitingState({ phase }: { phase: RunPhase }) {
  const currentIndex = ORDER.indexOf(phase);

  return (
    <div aria-live="polite" className="animate-rise">
      <Panel padded={false}>
        <div className="px-5 py-6 sm:px-6">
          <p className="font-display text-[1.375rem] font-semibold leading-[1.2] tracking-[-0.03em] sm:text-[1.625rem]">
            {RUN_PHASES[phase]}
          </p>

          <div
            aria-hidden
            className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
          >
            <div className="animate-sweep h-full w-1/4 rounded-full bg-primary" />
          </div>
        </div>

        <ol className="divide-y divide-line-soft border-t border-line-soft">
          {ORDER.map((step, index) => {
            const done = currentIndex > index;
            const active = currentIndex === index;

            return (
              <li
                key={step}
                className={`flex items-center gap-3 px-5 py-3 text-[0.9375rem] sm:px-6 ${
                  active || done ? "text-ink" : "text-ink-3"
                }`}
              >
                <StepMark done={done} active={active} />
                <span>{RUN_PHASES[step]}</span>
                <span className="ml-auto font-mono text-xs text-ink-3">
                  {done ? "done" : active ? "running" : "waiting"}
                </span>
              </li>
            );
          })}
        </ol>

        <p className="border-t border-line-soft bg-surface-2 px-5 py-3 text-sm leading-relaxed text-ink-2 sm:px-6">
          You can leave this tab and come back — scoring carries on without it.
        </p>
      </Panel>
    </div>
  );
}

function StepMark({ done, active }: { done: boolean; active: boolean }) {
  if (done) {
    return (
      <span
        aria-hidden
        className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"
      >
        <svg
          viewBox="0 0 16 16"
          className="size-2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
        </svg>
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={`size-4 shrink-0 rounded-full border-2 ${
        active ? "animate-pulse border-primary" : "border-line"
      }`}
    />
  );
}
