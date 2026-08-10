/**
 * Report which environment variables are present, where, and whether any of
 * them are somewhere they shouldn't be.
 *
 * Run this before anything that costs money. Lazy per-variable checks only
 * fire when that variable is first touched, which can be after a paid
 * Anthropic call has already run — see CLAUDE.md.
 *
 *   node tools/check-env.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, loadEnvFiles, color, heading } from "./_shared.mjs";

/**
 * Where each key is supposed to live. `local` means .env.local / .env on this
 * machine; the deployed homes are checked by eye, not by this script.
 */
const KEYS = [
  {
    name: "TRIGGER_SECRET_KEY",
    local: true,
    home: "Vercel (server-side) + .env.local",
    why: "Lets the Next.js server action trigger a run.",
  },
  {
    name: "TRIGGER_PROJECT_ID",
    local: true,
    home: ".env.local + trigger.config.ts",
    why: "Identifies the Trigger.dev project.",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    local: true,
    home: "Vercel + .env.local",
    why: "The address of your Supabase project. Public by design.",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    local: true,
    home: "Vercel + .env.local",
    why: "Lets the browser sign in. Public by design — row-level security is what protects the data.",
  },
  {
    name: "ANTHROPIC_API_KEY",
    local: false,
    home: "Trigger.dev dashboard (DEV and PROD)",
    why: "The task calls Claude. The frontend never does, and neither does this machine.",
    risk: "A local value silently overrides the dashboard's during 'trigger.dev dev'.",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    local: false,
    home: "nowhere — this project doesn't use it",
    why: "It bypasses every row-level security policy. Nothing here needs it, so its presence means something has gone wrong.",
    risk: "Anything holding this key can read and write every user's leads, policies ignored.",
  },
];

const loaded = loadEnvFiles();

heading("Environment");
console.log(
  loaded.length
    ? color("dim", `  read ${loaded.join(", ")}`)
    : color("yellow", "  no .env.local or .env found"),
);

let problems = 0;

heading("Required locally");
for (const key of KEYS.filter((k) => k.local)) {
  const value = process.env[key.name];
  if (value) {
    console.log(`  ${color("green", "✓")} ${key.name} ${color("dim", `(${mask(value)})`)}`);
  } else {
    problems++;
    console.log(`  ${color("red", "✗")} ${key.name} — missing`);
    console.log(`      ${color("dim", `${key.why} Belongs in: ${key.home}`)}`);
  }
}

heading("Must NOT be set on this machine");
for (const key of KEYS.filter((k) => !k.local)) {
  const value = process.env[key.name];
  if (value) {
    problems++;
    console.log(`  ${color("red", "✗")} ${key.name} is set locally`);
    console.log(
      `      ${color("dim", `${key.why}`)}`,
    );
    console.log(
      `      ${color("dim", `${key.risk} Belongs in: ${key.home}`)}`,
    );
  } else {
    console.log(`  ${color("green", "✓")} ${key.name} — absent, as intended`);
    console.log(`      ${color("dim", `Set it in: ${key.home}`)}`);
  }
}

// --- The secret boundary ----------------------------------------------------

heading("Secret boundary");

const leaked = Object.keys(process.env).filter(
  (name) =>
    name.startsWith("NEXT_PUBLIC_") &&
    /SECRET|API_KEY|TOKEN|ANTHROPIC|TRIGGER/i.test(name),
);

if (leaked.length) {
  problems++;
  console.log(`  ${color("red", "✗")} secret-looking NEXT_PUBLIC_ vars: ${leaked.join(", ")}`);
  console.log(`      ${color("dim", "Anything NEXT_PUBLIC_ is compiled into the browser bundle.")}`);
} else {
  console.log(`  ${color("green", "✓")} no secret-looking NEXT_PUBLIC_ variables`);
}

// The two NEXT_PUBLIC_SUPABASE_ vars are public on purpose and don't trip the
// check above. Say so out loud, because "a key in the browser bundle" reads
// like a violation of this project's own rule and it isn't one.
if (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  console.log(
    `  ${color("green", "✓")} Supabase publishable key is in the browser bundle — intended`,
  );
  console.log(
    `      ${color("dim", "It can only do what row-level security allows. See supabase/schema.sql.")}`,
  );
}

const gitignore = resolve(ROOT, ".gitignore");
if (!existsSync(gitignore)) {
  problems++;
  console.log(`  ${color("red", "✗")} no .gitignore — .env.local could be committed`);
} else if (!/^\s*\.env\*?/m.test(readFileSync(gitignore, "utf8"))) {
  problems++;
  console.log(`  ${color("red", "✗")} .gitignore doesn't cover .env files`);
} else {
  console.log(`  ${color("green", "✓")} .gitignore covers .env files`);
}

console.log("");
if (problems) {
  console.log(color("red", `${problems} problem${problems === 1 ? "" : "s"} to fix.\n`));
  process.exit(1);
}
console.log(color("green", "All good.\n"));

function mask(value) {
  return value.length <= 8 ? "set" : `${value.slice(0, 4)}…${value.slice(-4)}`;
}
