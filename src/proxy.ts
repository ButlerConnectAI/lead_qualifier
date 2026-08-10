import { NextResponse, type NextRequest } from "next/server";

import { updateSession, withSessionCookies } from "@/server/supabase/proxy";

/**
 * Next 16 calls this Proxy; it was called Middleware up to Next 15. Same thing.
 *
 * Two jobs, and only two:
 *
 *   1. Refresh the Supabase session, because Server Components can't write
 *      cookies and something has to.
 *   2. An *optimistic* redirect, so a signed-out visitor gets bounced to the
 *      login page instead of watching a protected page render and vanish.
 *
 * It is not the security boundary. It reads the session and nothing else — no
 * database calls — because it runs on every request including prefetches. The
 * real check is `verifySession()` in `src/lib/dal.ts`, called by each page and
 * each server action. Deleting this file should cost usability, never safety.
 */

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/auth"];

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { response, userId, configured } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Accounts aren't set up yet. Bouncing everything to a login page that also
  // can't work would just be a redirect loop with no explanation, so requests
  // are passed through and the pages say what's missing.
  if (!configured) return response;

  if (!userId && !isPublic(pathname)) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";

    // Where they were headed, so login can put them back there afterwards.
    // Only ever a path on this site — see the guard in the login action.
    if (pathname !== "/") login.searchParams.set("next", pathname);

    return withSessionCookies(NextResponse.redirect(login), response);
  }

  // Signed in with no reason to be on the login page.
  if (userId && (pathname === "/login" || pathname === "/forgot-password")) {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";

    return withSessionCookies(NextResponse.redirect(home), response);
  }

  return response;
}

export const config = {
  /*
   * Everything except static assets and image optimisation. Auth wants to run
   * on as much as possible: skipping a route here means its session silently
   * stops being refreshed.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
