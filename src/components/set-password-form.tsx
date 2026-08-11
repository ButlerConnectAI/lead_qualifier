"use client";

import { useActionState } from "react";

import { setPassword, type AuthFormState } from "@/app/auth/actions";
import { AuthField, SubmitButton } from "./auth-field";
import { ErrorNotice } from "./error-notice";
import { Panel } from "./panel";

export function SetPasswordForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(setPassword, {});

  return (
    <div className="space-y-4">
      {state.error && <ErrorNotice title="Couldn't set your password" message={state.error} />}

      <form action={action}>
        <Panel>
          <fieldset disabled={pending} className="space-y-4 disabled:opacity-55">
            <AuthField
              name="password"
              label="New password"
              type="password"
              autoComplete="new-password"
              autoFocus
            />
            <AuthField
              name="confirm"
              label="Type it again"
              type="password"
              autoComplete="new-password"
            />
          </fieldset>
        </Panel>

        <div className="mt-4">
          <SubmitButton pending={pending}>
            {pending ? "Saving…" : "Save password and continue"}
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
