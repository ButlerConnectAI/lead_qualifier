import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/server/supabase/server";

/**
 * Where every emailed link lands — invites and password resets alike.
 *
 * Both carry a one-time code that has to be traded for a session before it can
 * be used. Supabase sends that code in one of two shapes depending on how the
 * email template is written, so both are handled: a `code` (the PKCE flow) or a
 * `token_hash` with a `type` (the OTP flow). Supporting only one is why invite
 * links commonly appear to do nothing.
 *
 * A route handler is used rather than a page because this has to write the
 * session cookie, which a Server Component isn't allowed to do.
 */

/**
 * Only ever a path on this site.
 *
 * `next` comes out of a URL, so without this an attacker could send a link that
 * signs someone in and then forwards them somewhere of their choosing, with the
 * trust of having just come from a real login. A leading `//` is a
 * protocol-relative URL and leaves the site, so it's rejected too.
 */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";

  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) return NextResponse.redirect(`${origin}${next}`);

    console.error("auth/callback: could not exchange code", error.message);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (!error) {
      // An invite or a recovery link means there's no usable password yet, so
      // send them to set one rather than to a page they'll be bounced off.
      const destination =
        type === "invite" || type === "recovery" ? "/auth/set-password" : next;

      return NextResponse.redirect(`${origin}${destination}`);
    }

    console.error("auth/callback: could not verify link", error.message);
  }

  return NextResponse.redirect(`${origin}/auth/auth-error`);
}
