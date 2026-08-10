import { AuthLink, AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata = {
  title: "Reset your password — Lead Qualifier",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      caption="We'll email you a link that lets you choose a new one. It's good for an hour."
      footer={<AuthLink href="/login">Back to sign in</AuthLink>}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
