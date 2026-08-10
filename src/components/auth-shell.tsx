import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The frame every signed-out screen sits in.
 *
 * Narrower than the app itself and vertically centred, so arriving here reads
 * as a door rather than a page that failed to load. Same lockup as the main
 * header, so it's recognisably the same product before you're let in.
 */

export function AuthShell({
  title,
  caption,
  children,
  footer,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-14 sm:py-20">
      <main className="w-full max-w-sm">
        <header className="mb-7">
          <p className="text-sm font-medium text-ink-3">Butler Connect AI</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{title}</h1>
          {caption && (
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-2">{caption}</p>
          )}
        </header>

        {children}

        {footer && <div className="mt-5 text-sm text-ink-2">{footer}</div>}
      </main>
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="font-medium text-ink underline decoration-line underline-offset-4 transition-colors duration-200 ease-out hover:decoration-ink"
    >
      {children}
    </Link>
  );
}
