import { Qualifier } from "@/components/qualifier";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-14 sm:px-6 sm:py-20">
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
