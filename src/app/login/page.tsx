import { AuthLink, AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { Panel } from "@/components/panel";
import { hasAuthEnv } from "@/server/env";

export const metadata = {
  title: "Sign in — Lead Qualifier",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // The state this project is in the first time it's pulled, before the
  // Supabase project exists. Say so plainly instead of offering a form that
  // cannot work.
  if (!hasAuthEnv()) {
    return (
      <AuthShell title="Accounts aren't set up yet">
        <Panel>
          <p className="text-[0.9375rem] leading-relaxed text-ink-2">
            This site needs a Supabase project before anyone can sign in. Run{" "}
            <code className="font-mono text-sm text-ink">npm run check-env</code> — it names
            which keys are missing and where each one belongs. The setup steps are in{" "}
            <code className="font-mono text-sm text-ink">RUNBOOK.md</code>.
          </p>
        </Panel>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Sign in"
      caption="Scoring a lead costs real money, so the qualifier is behind an account."
      footer={<AuthLink href="/forgot-password">Forgotten your password?</AuthLink>}
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
