"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { hasAuthEnv } from "@/server/env";
import { createClient } from "@/server/supabase/server";

/**
 * Signing in, out, and choosing a password.
 *
 * There is no sign-up action, deliberately. Accounts are created by invitation
 * from the Supabase dashboard — see RUNBOOK.md. Every scoring run spends real
 * money, so self-registration would let a stranger spend it.
 */

export type AuthFormState = {
  error?: string;
  notice?: string;
};

const CredentialsSchema = z.object({
  email: z.email({ error: "That doesn't look like an email address." }).trim(),
  password: z.string().min(1, { error: "Enter your password." }),
});

const EmailSchema = z.object({
  email: z.email({ error: "That doesn't look like an email address." }).trim(),
});

const NewPasswordSchema = z
  .object({
    password: z.string().min(8, { error: "Use at least 8 characters." }),
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    error: "Those two passwords don't match.",
    path: ["confirm"],
  });

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

/**
 * Where this site is, for building the link that goes in an email.
 *
 * `origin` is set on server action POSTs, but it's the only thing standing
 * between a working reset link and one that goes nowhere — and the failure is
 * invisible until somebody can't get back into their account. So the host
 * headers are a fallback rather than a hope.
 */
async function siteOrigin(): Promise<string> {
  const head = await headers();

  const origin = head.get("origin");
  if (origin) return origin;

  const host = head.get("x-forwarded-host") ?? head.get("host");
  const protocol = head.get("x-forwarded-proto") ?? "https";

  return host ? `${protocol}://${host}` : "";
}

const NOT_CONFIGURED =
  "Accounts aren't set up on this site yet: the Supabase keys are missing. Run `npm run check-env` — it names what's missing and where it belongs.";

/**
 * Only ever a path on this site.
 *
 * `next` arrives in the query string, so without this check anyone could send a
 * link that logs you in and then forwards you to a site of their choosing. A
 * leading `//` is a protocol-relative URL and goes off-site, so it's rejected
 * along with anything not starting with a single slash.
 */
function safeNext(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  return value;
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!hasAuthEnv()) return { error: NOT_CONFIGURED };

  const parsed = CredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Deliberately the same message for a wrong password and an email with no
    // account: telling them apart lets someone enumerate who has an account.
    return { error: "That email and password don't match an account." };
  }

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signOut(): Promise<void> {
  if (hasAuthEnv()) {
    const supabase = await createClient();

    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!hasAuthEnv()) return { error: NOT_CONFIGURED };

  const parsed = EmailSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/auth/set-password`,
  });

  // Always the same answer, whether or not that address has an account — for
  // the same reason the sign-in error is vague.
  return {
    notice: "If that address has an account, a reset link is on its way to it.",
  };
}

export async function setPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!hasAuthEnv()) return { error: NOT_CONFIGURED };

  const parsed = NewPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();

  // Requires the session the invite or reset link established. Without one
  // there is nothing to update, which is what stops this being a way to change
  // somebody else's password.
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims?.sub) {
    return {
      error:
        "That link has expired. Ask for a new one from the login page and use it within the hour.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/");
}
