import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * The Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Must be created per request — it closes over that request's cookies, so a
 * module-level singleton would serve one visitor's session to another.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components are not allowed to write cookies. That's fine:
            // a refresh that lands here has already been done by `proxy.ts`,
            // which runs first and can write to the response. Without the
            // catch, every signed-in page render throws.
          }
        },
      },
    },
  );
}
