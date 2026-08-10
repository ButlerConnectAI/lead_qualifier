import Link from "next/link";
import { Qualifier } from "@/components/qualifier";
import { PREVIEW_KEYS, PREVIEW_VERDICTS, isPreviewKey } from "@/components/preview-fixtures";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { preview } = await searchParams;
  const key = typeof preview === "string" && isPreviewKey(preview) ? preview : undefined;

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

        <Qualifier key={key ?? "live"} preview={key ? PREVIEW_VERDICTS[key] : undefined} />
      </main>

      {process.env.NODE_ENV !== "production" && <PreviewBar active={key} />}
    </div>
  );
}

/**
 * Stage 03 scaffolding — a way to see each verdict layout without a run.
 * Dev only, and deleted along with the fixtures once stage 04 is signed off.
 */
function PreviewBar({ active }: { active?: string }) {
  return (
    <div className="sticky bottom-0 border-t border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center gap-2 px-5 py-2.5 sm:px-6">
        <span className="mr-1 text-xs font-medium text-ink-3">Preview</span>
        <PreviewLink href="/" label="Form" active={active === undefined} />
        {PREVIEW_KEYS.map((preview) => (
          <PreviewLink
            key={preview}
            href={`/?preview=${preview}`}
            label={preview}
            active={active === preview}
          />
        ))}
      </div>
    </div>
  );
}

function PreviewLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors duration-200 ease-out ${
        active
          ? "border-transparent bg-solid text-on-solid"
          : "border-line text-ink-2 hover:border-ink-3 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
