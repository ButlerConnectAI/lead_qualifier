# 07 — Accounts and saved history

## Goal

The site is behind a sign-in, and every lead Jake scores is kept so he can look at it again.

Accounts are **invite-only** — there is no signup page. Jake creates users in the Supabase
dashboard. Every scoring run spends Anthropic money, so self-registration would let a stranger
spend it, and closing that is half the point of this stage.

Nothing about scoring changes. The task, the rubric, and the payload are untouched, which is why
this stage ships with `git push` alone and needs no `npm run deploy:task`.

## Steps

1. **Database first, so nothing is written against a table that doesn't exist.** `supabase/schema.sql`
   holds the `lead_runs` table and its row-level security policies, written to be safe to run
   twice. Jake pastes it into the Supabase SQL editor; there is no migration tool and no CLI.
2. **The plumbing.** `src/server/supabase/` builds the request-scoped clients; `src/server/dal.ts`
   is the authorization boundary. Everything auth-related lives in `src/server/`, never
   `src/lib/` — `src/lib/` is shared with the task, and putting web-only code there would make the
   "changes here need a deploy" rule fire for no reason.
3. **The optimistic layer.** `src/proxy.ts` refreshes the session and redirects signed-out
   visitors. It is a convenience, not the boundary, and it must stay free of database calls.
4. **The screens.** Sign in, forgotten password, choose-a-password, and the callback route the
   emailed links land on. All reuse `panel.tsx` and the tokens in `globals.css` — no new colours.
5. **Gate the existing actions.** Both server actions in `src/app/actions.ts` re-check the session
   for themselves, because a server action is reachable without ever loading a page.
6. **History.** The list, one saved verdict, and the catching-up that fills in runs which finished
   while the tab was closed.

## Done-test

Jake runs these. Claude does not run them on his behalf and does not decide whether the result is
good enough.

1. `npm run check-env` — the two Supabase variables present, `ANTHROPIC_API_KEY` still absent,
   "All good."
2. RLS is on, checked by query rather than by the Table Editor badge — that badge is unreliable
   and frequently absent. `select relrowsecurity from pg_class where relname = 'lead_runs'` must
   be `true`, with 4 rows in `pg_policies` for the table.
3. Signed out, in a **private window**: `localhost:3000` lands on the sign-in page, and so does
   `/history` typed directly. The lead form is not visible to anyone signed out.
4. Invite yourself, set a password, land signed in.
5. Score a lead. It behaves exactly as it did before this stage.
6. **History** lists it with its score and tier; opening it shows the full verdict and what was
   typed.
7. Score another lead and close the tab while it's still going. Reopen History — the row is there
   and fills itself in within a few seconds.
8. **The test that actually proves it:** invite a second account, sign in as it, confirm its
   history is empty, and paste the first account's history URL straight into the address bar. It
   must say not found. This is the one that shows the database is enforcing separation rather than
   the page hiding things. Delete the throwaway account afterwards.
9. `npm run smoke -- strong-fit` still passes, proving the scorer was untouched.
10. On the live site, view source: no Trigger.dev key, no Anthropic key. The Supabase URL and
    publishable key **will** be visible — that is correct, and step 8 is what makes it safe.

Only after 1–10 is the stage done.
