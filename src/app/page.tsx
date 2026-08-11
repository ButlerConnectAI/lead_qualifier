import { AppShell, PageBody, PageHeader } from "@/components/app-shell";
import { Qualifier } from "@/components/qualifier";
import { verifySession } from "@/server/dal";

export default async function Home() {
  // The check that counts. The proxy bounces signed-out visitors before they
  // get here, but that's a convenience — this is what actually protects the
  // page, and the server actions do the same for themselves.
  const user = await verifySession();

  return (
    <AppShell email={user.email} current="score">
      <PageHeader
        title="Score a lead"
        caption="The verdict predicts whether you'll be glad you took the work — and what to agree in writing first."
      />

      <PageBody>
        <Qualifier />
      </PageBody>
    </AppShell>
  );
}
