import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasAuthEnv } from "../env";

/**
 * Refreshes the Supabase session on every request and reports who's signed in.
 *
 * Access tokens are short-lived. Server Components can't write cookies, so
 * something that runs *before* them has to do the refresh and put the new
 * tokens on the response — that's this. Without it a signed-in user gets
 * quietly logged out when their token expires.
 *
 * Two things here are load-bearing and easy to undo by accident:
 *
 * 1. `setAll` rebuilds `response` from the mutated request rather than editing
 *    the old one. The refreshed cookies have to be readable by the Server
 *    Components rendering *this* request, not just present on the reply to it.
 *
 * 2. The `headers` argument carries `Cache-Control: no-store` and friends.
 *    Supabase supplies them because a response carrying a Set-Cookie for one
 *    user's session must never be cached by Vercel's CDN and handed to
 *    somebody else. Dropping them is a session-leak bug that only shows up
 *    behind a CDN, so it would not reproduce locally.
 *
 * Callers must return this `response` (or copy its cookies onto their own —
 * see `withSessionCookies`), or the refreshed session is thrown away and the
 * user is logged out on the next request.
 */
export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  userId: string | null;
  configured: boolean;
}> {
  let response = NextResponse.next({ request });

  // Nothing to refresh, and building a client would throw on the missing URL.
  // Reported rather than swallowed so the proxy can leave the login page
  // reachable and let it explain itself.
  if (!hasAuthEnv()) return { response, userId: null, configured: false };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          response = NextResponse.next({ request });

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }

          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  // Must be awaited here, before any response is generated. A refresh that
  // finishes after the response is committed can't write its cookies and is
  // lost, which makes every subsequent request refresh again.
  //
  // getClaims() verifies the token's signature rather than trusting the cookie.
  // getSession() is never trusted in server code.
  const { data, error } = await supabase.auth.getClaims();

  return {
    response,
    userId: error ? null : (data?.claims.sub ?? null),
    configured: true,
  };
}

/**
 * Carries a refreshed session onto a different response.
 *
 * Redirecting builds a brand-new response, which doesn't have the cookies the
 * refresh just wrote. Without this, being redirected to the login page would
 * also discard the session that was being refreshed on the way there.
 */
export function withSessionCookies(
  target: NextResponse,
  source: NextResponse,
): NextResponse {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }

  target.headers.set("Cache-Control", "private, no-store");

  return target;
}
