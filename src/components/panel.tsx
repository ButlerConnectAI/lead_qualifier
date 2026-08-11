import type { ReactNode } from "react";

/**
 * The surfaces every view is built from.
 *
 * A white card on the tinted app ground, held by a hairline with a very low
 * shadow under it. The shadow is doing almost nothing on its own — the border
 * is what separates the card — but without it the card reads as pasted onto the
 * page rather than sitting on it.
 *
 * A titled card gets a divided header rather than a heading floating above the
 * content. That division is what makes a card look built rather than drawn: the
 * label belongs to the card, not to the gap above it.
 *
 * `SolidPanel` is the one inversion, kept for a single closing statement per
 * screen. It stops being emphasis the moment there are two of them.
 */

export function Panel({
  title,
  caption,
  aside,
  padded = true,
  children,
}: {
  title?: string;
  caption?: string;
  aside?: ReactNode;
  padded?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-panel border border-line bg-surface shadow-card">
      {title && (
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5 border-b border-line-soft px-5 py-3.5 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-[-0.01em] text-ink">{title}</h2>
            {caption && (
              <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-ink-2">{caption}</p>
            )}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
      )}

      <div className={padded ? "px-5 py-4 sm:px-6 sm:py-5" : ""}>{children}</div>
    </section>
  );
}

export function SolidPanel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="rounded-panel bg-ink px-5 py-5 text-white shadow-raised sm:px-6">
      <h2 className="text-xs font-medium uppercase tracking-[0.07em] text-white/50">{label}</h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

/**
 * A small status pill. One shape for every state in the product, so "strong" on
 * a criterion and "Qualified" on a verdict are visibly the same kind of fact.
 */
export function Pill({
  tone,
  children,
}: {
  tone: "qualified" | "nurture" | "disqualified" | "neutral";
  children: ReactNode;
}) {
  const TONES = {
    qualified: "bg-qualified-soft text-qualified border-qualified-line",
    nurture: "bg-nurture-soft text-nurture border-nurture-line",
    disqualified: "bg-disqualified-soft text-disqualified border-disqualified-line",
    neutral: "bg-surface-2 text-ink-2 border-line",
  } as const;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
