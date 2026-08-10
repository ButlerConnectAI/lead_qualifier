import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth-shell";
import { SetPasswordForm } from "@/components/set-password-form";
import { getUser } from "@/server/dal";

export const metadata = {
  title: "Choose a password — Lead Qualifier",
};

/**
 * Where an invite or a reset link lands.
 *
 * Both arrive as a one-time code that `/auth/callback` has already exchanged
 * for a session, so by the time anyone gets here they are technically signed
 * in — they just don't have a password yet. Without that session there's
 * nothing to change, which is what stops this being a way to set someone
 * else's.
 */
export default async function SetPasswordPage() {
  const user = await getUser();

  if (!user) redirect("/auth/auth-error");

  return (
    <AuthShell
      title="Choose a password"
      caption={`You're signed in as ${user.email ?? "your account"}. Pick a password and you're done.`}
    >
      <SetPasswordForm />
    </AuthShell>
  );
}
