import Link from "next/link";
import type { ReactNode } from "react";

import { signOut } from "@/app/auth/actions";

/**
 * The frame every signed-in screen sits in.
 *
 * The application's own furniture: a persistent rail on the left carrying the
 * product mark, the two destinations and the account, and a content column to
 * the right of it. This is the pattern every product application uses, and the
 * reason is that it makes the page a *place* — you can see where you are and
 * where else you could be without reading anything.
 *
 * Rendered by each page rather than by a route layout. Layouts don't re-render
 * on navigation, so the signed-in email would go stale moving between pages —
 * and Next's guidance is explicit that a layout is the wrong place to reason
 * about the session at all.
 *
 * No drawer on small screens. The rail becomes a horizontal bar instead, which
 * costs nothing, needs no client JavaScript, and can't get stuck open.
 */

type Destination = "score" | "history";

const NAV: { id: Destination; href: string; label: string; icon: ReactNode }[] = [
  {
    id: "score",
    href: "/",
    label: "Score a lead",
    icon: (
      <>
        <circle cx="8" cy="8" r="6" />
        <circle cx="8" cy="8" r="2.25" />
        <path d="M8 .8v2.4M8 12.8v2.4M.8 8h2.4M12.8 8h2.4" />
      </>
    ),
  },
  {
    id: "history",
    href: "/history",
    label: "History",
    icon: (
      <>
        <path d="M8 4.2V8l2.6 1.6" />
        <path d="M1.9 6.6A6.2 6.2 0 1 1 2.4 10" />
        <path d="M1.4 3.4v3.2h3.2" />
      </>
    ),
  },
];

export function AppShell({
  email,
  current,
  children,
}: {
  email: string | null;
  current: Destination;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <div className="flex shrink-0 flex-col border-b border-line bg-surface lg:w-[15.5rem] lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-x-6 px-4 py-3 lg:flex-col lg:items-stretch lg:gap-y-6 lg:px-3 lg:py-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-control lg:px-2 lg:pt-1">
            <BrandMark />
            {/* The wordmark goes on a phone: the page's own title is the more
                useful thing to spend that width on, and the mark still says
                which product this is. */}
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-display text-base font-semibold tracking-[-0.02em]">
                Lead Qualifier
              </span>
              <span className="mt-1 hidden text-xs text-ink-3 lg:block">Butler Connect AI</span>
            </span>
          </Link>

          <nav className="flex min-w-0 items-center gap-1 lg:flex-col lg:items-stretch lg:gap-0.5">
            {NAV.map((item) => {
              const active = item.id === current;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex items-center gap-2.5 rounded-control px-2.5 py-2 text-sm transition-colors duration-150 ease-out",
                    active
                      ? "bg-primary-soft font-medium text-primary"
                      : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                  ].join(" ")}
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 16 16"
                    className="size-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {item.icon}
                  </svg>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Pinned to the bottom of the rail on desktop, trailing on mobile. */}
          <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:mt-auto lg:flex-col lg:items-stretch lg:gap-0 lg:border-t lg:border-line-soft lg:pt-3">
            {email && (
              <span
                title={email}
                className="hidden max-w-[12rem] truncate px-2.5 pb-2 text-xs text-ink-3 lg:block"
              >
                {email}
              </span>
            )}

            {/* A form, not a link: signing out changes something on the server. */}
            <form action={signOut}>
              <button
                type="submit"
                className="w-full rounded-control px-2.5 py-2 text-left text-sm text-ink-2 transition-colors duration-150 ease-out hover:bg-surface-2 hover:text-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

/**
 * The page's own header strip, inside the content column.
 *
 * Title on the left, one action on the right — the standard arrangement,
 * because it puts the thing you do on this page in the same spot on every page.
 */
export function PageHeader({
  title,
  caption,
  back,
  meta,
  action,
}: {
  title: string;
  caption?: string;
  back?: { href: string; label: string };
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="border-b border-line bg-gradient-to-b from-surface to-surface-2/60 px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          {back && (
            <Link
              href={back.href}
              className="mb-2 inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors duration-150 ease-out hover:text-ink"
            >
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.5 3.5 5 8l4.5 4.5" />
              </svg>
              {back.label}
            </Link>
          )}

          <h1 className="truncate font-display text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[2.25rem]">
            {title}
          </h1>

          {caption && (
            <p className="mt-2 max-w-[62ch] text-[0.9375rem] leading-relaxed text-ink-2">
              {caption}
            </p>
          )}

          {meta}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}

/** The scrolling body of a page, holding the content column to a readable width. */
export function PageBody({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </main>
  );
}

function BrandMark() {
  return (
    <span
      aria-hidden
      className="flex size-7 items-center justify-center rounded-[0.5rem] bg-primary text-on-primary shadow-card"
    >
      <svg
        viewBox="0 0 16 16"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3.2 8.6 6.4 11.6 12.8 4.8" />
      </svg>
    </span>
  );
}
