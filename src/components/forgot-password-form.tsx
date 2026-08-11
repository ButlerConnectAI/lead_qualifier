"use client";

import { useActionState } from "react";

import { requestPasswordReset, type AuthFormState } from "@/app/auth/actions";
import { AuthField, SubmitButton } from "./auth-field";
import { ErrorNotice } from "./error-notice";
import { Panel } from "./panel";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.notice) {
    return (
      <Panel title="Check your email">
        <p className="text-[0.9375rem] leading-relaxed text-ink-2">{state.notice}</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      {state.error && <ErrorNotice title="Couldn't send the link" message={state.error} />}

      <form action={action}>
        <Panel>
          <fieldset disabled={pending} className="disabled:opacity-55">
            <AuthField
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
            />
          </fieldset>
        </Panel>

        <div className="mt-4">
          <SubmitButton pending={pending}>
            {pending ? "Sending…" : "Email me a reset link"}
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
