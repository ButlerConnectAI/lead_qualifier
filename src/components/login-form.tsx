"use client";

import { useActionState } from "react";

import { signIn, type AuthFormState } from "@/app/auth/actions";
import { AuthField, SubmitButton } from "./auth-field";
import { ErrorNotice } from "./error-notice";
import { Panel } from "./panel";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signIn, {});

  return (
    <div className="space-y-3">
      {state.error && <ErrorNotice title="Couldn't sign you in" message={state.error} />}

      <form action={action}>
        <input type="hidden" name="next" value={next ?? "/"} />

        <Panel bare>
          <fieldset disabled={pending} className="space-y-5 disabled:opacity-55">
            <AuthField
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
            />
            <AuthField
              name="password"
              label="Password"
              type="password"
              autoComplete="current-password"
            />
          </fieldset>
        </Panel>

        <div className="mt-3">
          <SubmitButton pending={pending}>{pending ? "Signing in…" : "Sign in"}</SubmitButton>
        </div>
      </form>
    </div>
  );
}
