/**
 * Shown above the form when a run couldn't start, or started and then failed.
 *
 * The form keeps what was typed, so this reads as "try that again" rather than
 * "start over". Every failure path ends here — a spinner is never the last
 * thing on screen.
 *
 * Carries the disqualified tier's colour, which is the same colour the form
 * already marks a bad field with. Nothing new is introduced for errors.
 */

export function ErrorNotice({ title, message }: { title: string; message: string }) {
  return (
    <section
      role="alert"
      className="flex gap-3 rounded-panel border border-disqualified-line bg-disqualified-soft px-5 py-4 shadow-card sm:px-6"
    >
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="mt-0.5 size-4 shrink-0 text-disqualified"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <circle cx="8" cy="8" r="6.4" />
        <path d="M8 4.9v3.6M8 11h.01" />
      </svg>

      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-disqualified">{title}</h2>
        <p className="mt-1 max-w-[70ch] text-[0.9375rem] leading-relaxed text-ink-2">
          {message}
        </p>
      </div>
    </section>
  );
}
