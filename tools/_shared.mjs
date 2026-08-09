/**
 * Shared helpers for the tools/ scripts.
 *
 * These run before `npm install` has necessarily happened, so this file has no
 * dependencies — including no dotenv. It parses .env files itself.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const RESET = "\x1b[0m";
const COLORS = { red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", dim: "\x1b[2m", bold: "\x1b[1m" };

export function color(name, text) {
  return `${COLORS[name] ?? ""}${text}${RESET}`;
}

/**
 * Load .env.local then .env into process.env, without overwriting anything
 * already set — a real shell variable should always beat a file.
 */
export function loadEnvFiles() {
  const loaded = [];
  for (const file of [".env.local", ".env"]) {
    const path = resolve(ROOT, file);
    if (!existsSync(path)) continue;
    loaded.push(file);
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (!match || line.trimStart().startsWith("#")) continue;
      const key = match[1];
      if (process.env[key] !== undefined) continue;
      let value = (match[2] ?? "").trim();
      if (/^(["']).*\1$/s.test(value)) value = value.slice(1, -1);
      process.env[key] = value;
    }
  }
  return loaded;
}

export function fail(message, hint) {
  console.error(`\n${color("red", "✗")} ${message}`);
  if (hint) console.error(`  ${color("dim", hint)}`);
  console.error("");
  process.exit(1);
}

export function heading(text) {
  console.log(`\n${color("bold", text)}`);
}
