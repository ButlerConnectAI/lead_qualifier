import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { hasAuthEnv } from "./env";
import { createClient } from "./supabase/server";

/**
 * The authorization boundary.
 *
 * `proxy.ts` also bounces signed-out visitors, but that is a convenience, not
 * the boundary — Next's own guidance is explicit that the proxy runs on every
 * request including prefetches and must not be the thing protecting data. The
 * check that counts is this one, called next to the data it protects: every
 * page, and every server action, does it for itself.
 *
 * Layouts deliberately don't guard anything either. They don't re-render on
 * navigation, so a check there would pass once and then stop being asked.
 *
 * `cache()` means the several callers in one request share a single answer.
 */

export type SessionUser = {
  id: string;
  email: string | null;
};

/**
 * Who's signed in, or null. Use in server actions and anywhere a redirect would
 * be the wrong answer.
 *
 * `getClaims()` verifies the token's signature rather than believing the
 * cookie. `getSession()` reads the cookie without verifying it and is never
 * trusted in server code.
 */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  // Before building a client, because its constructor throws on a missing URL
  // and "nobody is signed in" is the honest answer when accounts aren't set up.
  if (!hasAuthEnv()) return null;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) return null;

  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
});

/** Same, but sends signed-out visitors to the login page. Use in pages. */
export const verifySession = cache(async (): Promise<SessionUser> => {
  const user = await getUser();

  if (!user) redirect("/login");

  return user;
});
