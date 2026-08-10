/**
 * Shown above the form when a run couldn't start, or started and then failed.
 *
 * The form keeps what was typed, so this reads as "try that again" rather than
 * "start over". Every failure path ends here — a spinner is never the last
 * thing on screen.
 *
 * The only colour is the hairline and the label, borrowed from the
 * disqualified tier, matching how the form already marks a bad field. The
 * verdict stripe is still the only place colour carries meaning.
 */

export function ErrorNotice({ title, message }: { title: string; message: string }) {
  return (
    <section
      role="alert"
      className="rounded-panel border border-disqualified bg-panel p-5 sm:p-7"
    >
      <h2 className="text-sm font-semibold tracking-tight text-disqualified">{title}</h2>
      <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">{message}</p>
    </section>
  );
}
