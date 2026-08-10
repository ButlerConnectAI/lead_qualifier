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
    <div aria-live="polite" className="space-y-3">
      <Panel bare>
        <p className="text-xl font-medium leading-snug tracking-tight sm:text-[1.375rem]">
          {RUN_PHASES[phase]}
        </p>

        <div
          aria-hidden
          className="mt-6 h-1 w-full overflow-hidden rounded-full bg-panel-2"
        >
          <div className="animate-sweep h-full w-1/4 rounded-full bg-solid" />
        </div>
      </Panel>

      <Panel title="Steps">
        <ol className="divide-y divide-line-soft">
          {ORDER.map((step, index) => {
            const done = currentIndex > index;
            const active = currentIndex === index;

            return (
              <li
                key={step}
                className={`flex items-center justify-between gap-4 py-2.5 text-[0.9375rem] first:pt-0 last:pb-0 ${
                  active ? "text-ink" : "text-ink-3"
                }`}
              >
                <span>{RUN_PHASES[step]}</span>
                <span className="font-mono text-xs">
                  {done ? "done" : active ? "running" : "waiting"}
                </span>
              </li>
            );
          })}
        </ol>

        <p className="mt-5 text-sm leading-relaxed text-ink-2">
          You can leave this tab and come back — scoring carries on without it.
        </p>
      </Panel>
    </div>
  );
}
