import Link from "next/link";

import { signOut } from "@/app/auth/actions";

/**
 * The signed-in bar.
 *
 * Rendered by each protected page rather than by a layout. Layouts don't
 * re-render on navigation, so anything derived from the session would go stale
 * the moment you moved between pages — and Next's guidance is explicit that a
 * layout is the wrong place to reason about auth at all.
 *
 * Deliberately quiet: a hairline, grey text, no colour. Colour on this page
 * means a tier and nothing else.
 */

const LINK =
  "text-sm transition-colors duration-200 ease-out hover:text-ink focus-visible:text-ink";

export function SiteHeader({
  email,
  current,
}: {
  email: string | null;
  current: "score" | "history";
}) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5 sm:px-6">
        <nav className="flex items-center gap-5">
          <Link
            href="/"
            className={`${LINK} ${current === "score" ? "font-medium text-ink" : "text-ink-2"}`}
            aria-current={current === "score" ? "page" : undefined}
          >
            Score a lead
          </Link>
          <Link
            href="/history"
            className={`${LINK} ${current === "history" ? "font-medium text-ink" : "text-ink-2"}`}
            aria-current={current === "history" ? "page" : undefined}
          >
            History
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {email && <span className="hidden text-sm text-ink-3 sm:inline">{email}</span>}

          {/* A form, not a link: signing out changes something on the server. */}
          <form action={signOut}>
            <button type="submit" className={`${LINK} text-ink-2`}>
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
