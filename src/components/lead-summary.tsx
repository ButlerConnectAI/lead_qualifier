import { LEAD_FIELDS, type Lead } from "@/lib/types";
import { Panel } from "./panel";

/**
 * What was actually typed, kept alongside the verdict.
 *
 * A score is only meaningful next to what it was a score of — and since the
 * rubric in `icp.ts` gets edited over time, an old verdict can only be judged
 * if the lead that produced it is still readable.
 *
 * Labels are written here rather than shared with `lead-form.tsx`. That file's
 * copy carries placeholders and hints for someone filling a form in; this is a
 * record being read back, and the two drifting apart is fine.
 */

const LABELS: Record<(typeof LEAD_FIELDS)[number], string> = {
  company: "Company",
  ask: "What they asked for",
  website: "Website",
  industry: "Industry",
  companySize: "Size",
  contactName: "Contact",
  contactRole: "Their role",
  budgetSignal: "Budget signal",
  timeline: "Timeline",
  source: "Source",
  notes: "Notes",
};

export function LeadSummary({ lead }: { lead: Lead }) {
  const present = LEAD_FIELDS.filter((field) => {
    const value = lead[field];
    return typeof value === "string" && value.trim() !== "";
  });

  return (
    <Panel title="The lead as you entered it">
      <dl className="divide-y divide-line-soft">
        {present.map((field) => (
          <div key={field} className="py-3 first:pt-0 last:pb-0 sm:grid sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
            <dt className="text-sm text-ink-2">{LABELS[field]}</dt>
            <dd className="mt-1 whitespace-pre-wrap text-[0.9375rem] leading-relaxed sm:mt-0">
              {lead[field]}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
