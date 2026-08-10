import Link from "next/link";

import { HistoryList } from "@/components/history-list";
import { HistoryReconciler } from "@/components/history-reconciler";
import { Panel } from "@/components/panel";
import { SiteHeader } from "@/components/site-header";
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
    <div className="flex flex-1 flex-col">
      <SiteHeader email={user.email} current="history" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12 sm:px-6 sm:py-16">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">History</h1>
          <p className="mt-3 max-w-[52ch] text-[0.9375rem] leading-relaxed text-ink-2">
            Every lead you&rsquo;ve scored, newest first. Only you can see these.
          </p>
        </header>

        {entries.length === 0 ? (
          <Panel title="Nothing scored yet">
            <p className="text-[0.9375rem] leading-relaxed text-ink-2">
              Leads you score will collect here, so you can look back at what you decided and
              why.{" "}
              <Link
                href="/"
                className="font-medium text-ink underline decoration-line underline-offset-4 transition-colors duration-200 ease-out hover:decoration-ink"
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
      </main>
    </div>
  );
}
