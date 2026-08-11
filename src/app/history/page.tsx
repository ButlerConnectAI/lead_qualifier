import Link from "next/link";

import { AppShell, PageBody, PageHeader } from "@/components/app-shell";
import { HistoryList } from "@/components/history-list";
import { HistoryReconciler } from "@/components/history-reconciler";
import { Panel } from "@/components/panel";
import { verifySession } from "@/server/dal";
import { listHistory } from "@/server/history";

export const metadata = {
  title: "History — Lead Qualifier",
};

export default async function HistoryPage() {
  const user = await verifySession();
  const entries = await listHistory();

  const pending = entries.some((entry) => entry.status === "pending");

  return (
    <AppShell email={user.email} current="history">
      <PageHeader
        title="History"
        caption="Every lead you've scored, newest first. Only you can see these."
        action={
          entries.length > 0 ? (
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-card transition-colors duration-150 ease-out hover:bg-primary-hover"
            >
              Score a lead
            </Link>
          ) : undefined
        }
      />

      <PageBody>
        {entries.length === 0 ? (
          <Panel title="Nothing scored yet">
            <p className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-ink-2">
              Leads you score will collect here, so you can look back at what you decided and
              why.{" "}
              <Link
                href="/"
                className="font-medium text-primary underline decoration-primary-line underline-offset-4 transition-colors duration-150 ease-out hover:decoration-primary"
              >
                Score your first lead
              </Link>
              .
            </p>
          </Panel>
        ) : (
          <HistoryList entries={entries} />
        )}

        {pending && <HistoryReconciler />}
      </PageBody>
    </AppShell>
  );
}
