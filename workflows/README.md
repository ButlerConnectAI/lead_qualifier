# Workflows — the W in WAT

Numbered build stages. Each file is instructions **for Claude**, not product code and not
documentation for users. Read the one you're on before starting; don't skip ahead.

Every file has the same three sections:

- **Goal** — what exists at the end that didn't exist at the start.
- **Steps** — what to do.
- **Done-test** — the check that must actually pass before moving on. Run it. "It looks right"
  is not the done-test.

| # | Stage | Ends with |
|---|---|---|
| [00](00-scaffold.md) | Scaffold the repo | Next dev server runs, Trigger.dev connects |
| [01](01-define-icp.md) | Define the ideal customer | A rubric Jake can read and edit |
| [02](02-build-task.md) | Build the scoring logic | A real verdict, produced locally, no deploy |
| [03](03-build-frontend.md) | Build the form and result UI | Both render against fake data |
| [04](04-connect.md) | Connect the two halves | Real submit → live verdict, locally |
| [05](05-deploy.md) | Deploy | A public URL that qualifies a lead |
| [06](06-evaluate.md) | Tune the rubric | A repeatable scoring loop with a log |
| [07](07-accounts.md) | Accounts and saved history | Sign-in required, every lead kept per account |

Stages 00–05 ship the product. 06 is ongoing and starts once there's real output worth arguing
with. The numbers are build order, not dependency order — 07 came after 06 was written, and
neither waits on the other.

## Rules that apply to every stage

- Stop at the done-test and report. Don't roll three stages into one pass.
- If a stage's assumptions turn out wrong, say so and update the workflow file — these are
  supposed to drift toward reality, not stay pristine.
- Anything learned the hard way goes in the failure log in [`CLAUDE.md`](../CLAUDE.md), with the
  root cause rather than the symptom.
