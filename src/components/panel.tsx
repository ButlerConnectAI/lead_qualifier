import type { ReactNode } from "react";

/**
 * The surfaces every view is built from.
 *
 * One shape, used everywhere: a near-white panel on a white page, separated by
 * a hairline rather than a shadow. Depth comes from two greys being one step
 * apart, which is the whole trick of the reference system — nothing floats.
 *
 * `SolidPanel` is the one inversion, kept for a single closing statement per
 * screen. It stops being emphasis the moment there are two of them.
 */

export function Panel({
  title,
  caption,
  bare = false,
  children,
}: {
  title?: string;
  caption?: string;
  bare?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-panel border border-line bg-panel p-5 sm:p-7">
      {title && <PanelHeading title={title} caption={caption} />}
      <div className={bare ? "" : title ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function PanelHeading({ title, caption }: { title: string; caption?: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
      {caption && <p className="mt-1 text-sm leading-relaxed text-ink-2">{caption}</p>}
    </div>
  );
}

export function SolidPanel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="rounded-panel bg-solid p-5 text-on-solid sm:p-7">
      <h2 className="text-sm font-medium text-on-solid/55">{label}</h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}
