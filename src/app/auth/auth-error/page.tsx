import { AuthLink, AuthShell } from "@/components/auth-shell";
import { Panel } from "@/components/panel";

export const metadata = {
  title: "That link didn't work — Lead Qualifier",
};

export default function AuthErrorPage() {
  return (
    <AuthShell title="That link didn't work">
      <Panel>
        <p className="text-[0.9375rem] leading-relaxed text-ink-2">
          Sign-in links can only be used once, and they expire about an hour after they&rsquo;re
          sent. Ask for a fresh one and use it straight away.
        </p>
      </Panel>

      <div className="mt-5 space-x-4 text-sm">
        <AuthLink href="/forgot-password">Send a new link</AuthLink>
        <AuthLink href="/login">Back to sign in</AuthLink>
      </div>
    </AuthShell>
  );
}
