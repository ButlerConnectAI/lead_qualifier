import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The frame every signed-out screen sits in.
 *
 * Narrower than the app itself and vertically centred, so arriving here reads
 * as a door rather than a page that failed to load. Same mark as the app's own
 * rail, so it's recognisably the same product before you're let in.
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
        <header className="mb-6">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-[0.5rem] bg-primary text-on-primary shadow-card"
            >
              <svg
                viewBox="0 0 16 16"
                className="size-[1.125rem]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3.2 8.6 6.4 11.6 12.8 4.8" />
              </svg>
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-base font-semibold tracking-[-0.02em]">
                Lead Qualifier
              </span>
              <span className="mt-1 text-xs text-ink-3">Butler Connect AI</span>
            </span>
          </div>

          <h1 className="mt-7 font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em]">
            {title}
          </h1>
          {caption && (
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-2">{caption}</p>
          )}
        </header>

        {children}

        {footer && <div className="mt-4 text-sm text-ink-2">{footer}</div>}
      </main>
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="font-medium text-primary underline decoration-primary-line underline-offset-4 transition-colors duration-150 ease-out hover:decoration-primary"
    >
      {children}
    </Link>
  );
}
