/**
 * Save a lead as an example file, for reuse in tools/smoke-test.mjs and the
 * rubric loop in workflows/06-evaluate.md.
 *
 * Add one every time a verdict is wrong — a disagreement you didn't save is a
 * disagreement you can't test a fix against.
 *
 *   node tools/new-lead.mjs
 *
 * These files are committed to git. Fictionalise company names and any
 * identifying detail before saving a real lead.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { ROOT, color, heading } from "./_shared.mjs";

const EXAMPLES_DIR = resolve(ROOT, "tools/example-leads");

const FIELDS = [
  { key: "company", label: "Company name", required: true },
  { key: "ask", label: "What they asked for / their pain point", required: true },
  { key: "website", label: "Website" },
  { key: "industry", label: "Industry" },
  { key: "companySize", label: "Company size" },
  { key: "contactName", label: "Contact name" },
  { key: "contactRole", label: "Contact role" },
  { key: "budgetSignal", label: "Budget signal (their words, if any)" },
  { key: "timeline", label: "Timeline" },
  { key: "source", label: "Where the lead came from" },
  { key: "notes", label: "Notes" },
];

const TIERS = ["qualified", "nurture", "disqualified"];

const rl = createInterface({ input: stdin, output: stdout });

heading("New example lead");
console.log(color("dim", "  Enter to skip an optional field. Fictionalise anything identifying.\n"));

const lead = {};
for (const field of FIELDS) {
  const suffix = field.required ? color("red", " *") : "";
  let value = "";
  do {
    value = (await rl.question(`  ${field.label}${suffix}: `)).trim();
    if (!value && field.required) console.log(color("red", "    Required."));
  } while (!value && field.required);
  if (value) lead[field.key] = value;
}

// The expected tier is what makes this file useful later: without it,
// tools/score-all.mjs has nothing to compare a verdict against.
heading("Your judgement");
console.log(color("dim", "  What tier does this lead actually deserve? This is the answer key.\n"));

let tier = "";
while (!TIERS.includes(tier)) {
  tier = (await rl.question(`  Tier (${TIERS.join(" / ")}): `)).trim().toLowerCase();
  if (!TIERS.includes(tier)) console.log(color("red", `    One of: ${TIERS.join(", ")}`));
}
const why = (await rl.question("  One line on why: ")).trim();

rl.close();

lead.expected = { tier, why };

if (!existsSync(EXAMPLES_DIR)) mkdirSync(EXAMPLES_DIR, { recursive: true });

const base = slug(lead.company);
let filename = `${base}.json`;
let n = 2;
while (existsSync(resolve(EXAMPLES_DIR, filename))) filename = `${base}-${n++}.json`;

const path = resolve(EXAMPLES_DIR, filename);
writeFileSync(path, `${JSON.stringify(lead, null, 2)}\n`, "utf8");

console.log(`\n${color("green", "✓")} Saved tools/example-leads/${filename}`);
console.log(color("dim", `  npm run smoke -- tools/example-leads/${filename}\n`));

function slug(text) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "lead"
  );
}
