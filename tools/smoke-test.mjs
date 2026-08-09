/**
 * Score one lead and print the verdict.
 *
 * With `npm run dev:task` running in another terminal, this sends a lead to
 * the task on this machine and prints what came back. With --prod it hits the
 * deployed task instead, which is how you confirm a deploy actually landed.
 *
 *   npm run smoke -- strong-fit      # a saved lead, by name
 *   npm run smoke                    # defaults to strong-fit
 *   npm run smoke -- --prod          # against production
 *
 * See RUNBOOK.md.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, loadEnvFiles, fail, color, heading } from "./_shared.mjs";

const TASK_ID = "qualify-lead";
const TIMEOUT_MS = 120_000;

loadEnvFiles();

const args = process.argv.slice(2);
const wantProd = args.includes("--prod");
const leadArg = args.find((a) => !a.startsWith("--"));

const secretKey = process.env.TRIGGER_SECRET_KEY;
if (!secretKey) {
  fail(
    "TRIGGER_SECRET_KEY is not set.",
    "Get it from the Trigger.dev dashboard → API Keys, and put it in .env.local.",
  );
}

// The key itself says which environment it targets, so a --prod run against a
// dev key would silently test the wrong thing.
const keyEnv = secretKey.startsWith("tr_prod_")
  ? "prod"
  : secretKey.startsWith("tr_dev_")
    ? "dev"
    : "unknown";

if (wantProd && keyEnv === "dev") {
  fail(
    "--prod was passed but TRIGGER_SECRET_KEY is a dev key.",
    "Set the production key for this run, e.g. $env:TRIGGER_SECRET_KEY='tr_prod_...'; node tools/smoke-test.mjs --prod",
  );
}
if (!wantProd && keyEnv === "prod") {
  console.log(
    color("yellow", "! TRIGGER_SECRET_KEY is a production key — this will run against production.\n"),
  );
}

let tasks, runs;
try {
  ({ tasks, runs } = await import("@trigger.dev/sdk"));
} catch {
  fail("@trigger.dev/sdk isn't installed.", "Run npm install — see workflows/00-scaffold.md.");
}

const leadPath = resolveLead(leadArg ?? "strong-fit");
const { expected, ...lead } = JSON.parse(readFileSync(leadPath, "utf8"));

heading(`Triggering ${TASK_ID} (${keyEnv})`);
console.log(color("dim", `  lead: ${lead.company ?? "(unnamed)"}`));

let handle;
try {
  handle = await tasks.trigger(TASK_ID, lead);
} catch (error) {
  fail(
    `Could not trigger ${TASK_ID}: ${error?.message ?? error}`,
    "If this says the task doesn't exist, the deploy didn't land: npx trigger.dev@latest deploy",
  );
}

console.log(color("dim", `  run: ${handle.id}`));

const startedAt = Date.now();
let run;
try {
  run = await runs.poll(handle.id, { pollIntervalMs: 1000, timeoutMs: TIMEOUT_MS });
} catch (error) {
  fail(
    `Gave up waiting after ${TIMEOUT_MS / 1000}s: ${error?.message ?? error}`,
    `Check the run in the dashboard: ${handle.id}`,
  );
}
const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

if (run.status !== "COMPLETED") {
  fail(
    `Run finished as ${run.status} after ${elapsed}s.`,
    run.error?.message ?? `Check the run in the dashboard: ${handle.id}`,
  );
}

const verdict = run.output ?? {};
const TIER_COLOR = { qualified: "green", nurture: "yellow", disqualified: "red" };

heading("Verdict");
console.log(
  `  ${color(TIER_COLOR[verdict.tier] ?? "bold", (verdict.tier ?? "?").toUpperCase())}` +
    `  ${color("bold", String(verdict.score ?? "?"))}/100` +
    `  ${color("dim", `(${elapsed}s)`)}`,
);
if (verdict.headline) console.log(`  ${verdict.headline}`);

// Print the whole verdict, not just the tier. A rubric change can move the
// score without changing anything that matters, and can be wrong in a way only
// reading the text catches.

if (verdict.criteria?.length) {
  heading("Criteria");
  for (const c of verdict.criteria) {
    console.log(`  ${color("dim", "·")} ${color("bold", c.name)}: ${c.verdict}`);
    if (c.reason) console.log(`      ${color("dim", c.reason)}`);
  }
}

if (verdict.biggestRisk) {
  heading("Biggest risk");
  console.log(`  ${verdict.biggestRisk}`);
}

if (verdict.missingInfo?.length) {
  heading("Ask before committing");
  for (const q of verdict.missingInfo) console.log(`  ${color("dim", "·")} ${q}`);
}

if (verdict.protectYourself?.length) {
  heading("Protect yourself");
  for (const t of verdict.protectYourself) console.log(`  ${color("dim", "·")} ${t}`);
}

if (verdict.nextAction) {
  heading("Next action");
  console.log(`  ${verdict.nextAction}`);
}

if (expected) {
  const expectedTier = expected.tier ?? expected;
  heading("Against expectation");
  console.log(
    verdict.tier === expectedTier
      ? `  ${color("green", "✓")} matched ${expectedTier}`
      : `  ${color("red", "✗")} expected ${color("bold", expectedTier)}, got ${color("bold", verdict.tier)}`,
  );
  if (expected.why) console.log(`      ${color("dim", expected.why)}`);
}

console.log(
  `\n${color("green", "✓")} Scored by the ${keyEnv === "prod" ? "deployed" : "local"} task.\n`,
);

/**
 * Accept a bare name ("ambiguous"), a filename, or a full path — this gets
 * typed by hand a lot. On a miss, list what's actually available rather than
 * making the reader go and look.
 */
function resolveLead(input) {
  const dir = resolve(ROOT, "tools/example-leads");
  const candidates = [
    resolve(ROOT, input),
    resolve(dir, input),
    resolve(dir, `${input}.json`),
  ];

  const hit = candidates.find((p) => existsSync(p) && p.endsWith(".json"));
  if (hit) return hit;

  const available = existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(/\.json$/, ""))
    : [];

  fail(
    `No saved lead called "${input}".`,
    available.length
      ? `Available: ${available.join(", ")}`
      : "No saved leads yet — create one with: npm run new-lead",
  );
}
