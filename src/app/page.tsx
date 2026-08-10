import { Qualifier } from "@/components/qualifier";
import { SiteHeader } from "@/components/site-header";
import { verifySession } from "@/server/dal";

export default async function Home() {
  // The check that counts. The proxy bounces signed-out visitors before they
  // get here, but that's a convenience — this is what actually protects the
  // page, and the server actions do the same for themselves.
  const user = await verifySession();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader email={user.email} current="score" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12 sm:px-6 sm:py-16">
        <header className="mb-8">
          <p className="text-sm font-medium text-ink-3">Butler Connect AI</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Lead Qualifier
          </h1>
          <p className="mt-3 max-w-[52ch] text-[0.9375rem] leading-relaxed text-ink-2">
            Score an inquiry against your criteria before you reply to it. The verdict predicts
            whether you&rsquo;ll be glad you took the work — and what to agree in writing first.
          </p>
        </header>

        <Qualifier />
      </main>
    </div>
  );
}
