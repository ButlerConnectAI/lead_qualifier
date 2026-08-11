"use client";

import { useState } from "react";
import { LEAD_FIELDS, LeadSchema, type Lead } from "@/lib/types";
import { Panel } from "./panel";

/**
 * The form, validated against the same schema the task uses. There is no second
 * definition of what a valid lead is — if this and the task ever disagree, one
 * of them is wrong, and that can't happen while both read `LeadSchema`.
 *
 * Only company and ask are required. Everything else submits blank without
 * complaint, because a lead that arrives thin is itself a signal the rubric
 * knows how to read.
 *
 * The short context fields pair up two to a row. Eleven fields stacked in one
 * column reads as a long form and gets abandoned; the same eleven in a grid
 * reads as a short one, and the fields that pair are the ones you'd naturally
 * fill together — a name and the role next to it.
 */

type FieldName = (typeof LEAD_FIELDS)[number];

const FIELDS: Record<
  FieldName,
  {
    label: string;
    hint?: string;
    placeholder: string;
    multiline?: boolean;
    rows?: number;
    half?: boolean;
  }
> = {
  company: {
    label: "Company",
    placeholder: "Kessler & Roth CPAs",
  },
  ask: {
    label: "What they asked for",
    hint: "Paste their words rather than summarizing. The phrasing carries signal.",
    placeholder:
      "Our client onboarding is a mess and takes too long. We think AI could help.",
    multiline: true,
    rows: 5,
  },
  website: { label: "Website", placeholder: "kesslerroth.com", half: true },
  industry: { label: "Industry", placeholder: "Accounting firm", half: true },
  companySize: { label: "Size", placeholder: "About 30 employees", half: true },
  contactName: { label: "Contact name", placeholder: "Ruth Enwright", half: true },
  contactRole: { label: "Their role", placeholder: "Owner", half: true },
  budgetSignal: {
    label: "Budget signal",
    hint: "Anything they said about money, in their words. Leave blank if they said nothing — blank is not the same as no budget.",
    placeholder: "Pays an admin ~$1,200/month to do this by hand and would rather fix it.",
    multiline: true,
    rows: 2,
  },
  timeline: {
    label: "Timeline",
    placeholder: "Wants it live before their busy season, about 10 weeks.",
    multiline: true,
    rows: 2,
  },
  source: {
    label: "Where they came from",
    placeholder: "Referral from a previous client",
    half: true,
  },
  notes: {
    label: "Anything else",
    hint: "Systems they mentioned, who signs off, how the call felt.",
    placeholder: "Already on QuickBooks and Gmail. The job board is a Google Sheet.",
    multiline: true,
    rows: 4,
  },
};

const REQUIRED: FieldName[] = ["company", "ask"];
const OPTIONAL = LEAD_FIELDS.filter((field) => !REQUIRED.includes(field));

const EMPTY = Object.fromEntries(LEAD_FIELDS.map((field) => [field, ""])) as Record<
  FieldName,
  string
>;

export type LeadFormValues = Record<FieldName, string>;

export function LeadForm({
  onSubmit,
  busy,
  defaultValues,
}: {
  // The raw strings come back alongside the parsed lead so a failed run can
  // re-render this form still filled in, rather than losing what was typed.
  onSubmit: (lead: Lead, raw: LeadFormValues) => void;
  busy: boolean;
  defaultValues?: LeadFormValues;
}) {
  const [values, setValues] = useState<LeadFormValues>(defaultValues ?? EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Blank optional fields are dropped rather than sent as empty strings, so
    // the prompt sees a field that is absent, not one that is present and empty.
    const candidate = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value.trim() !== ""),
    );

    const result = LeadSchema.safeParse(candidate);

    if (!result.success) {
      const found: Partial<Record<FieldName, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as FieldName | undefined;
        if (field && !found[field]) found[field] = issue.message;
      }
      setErrors(found);
      return;
    }

    setErrors({});
    onSubmit(result.data, values);
  }

  function change(field: FieldName, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <fieldset disabled={busy} className="space-y-4 disabled:opacity-55">
        <Panel title="The lead" caption="The two things the scorer can't work without.">
          <div className="grid gap-4 sm:grid-cols-2">
            {REQUIRED.map((field) => (
              <Field
                key={field}
                name={field}
                value={values[field]}
                error={errors[field]}
                required
                onChange={(value) => change(field, value)}
              />
            ))}
          </div>
        </Panel>

        <Panel
          title="Context"
          caption="All optional. Leave anything blank that they didn't say — guessing on their behalf is worse than an empty field."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {OPTIONAL.map((field) => (
              <Field
                key={field}
                name={field}
                value={values[field]}
                error={errors[field]}
                onChange={(value) => change(field, value)}
              />
            ))}
          </div>
        </Panel>
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
        <p className="mr-auto text-sm text-ink-2">Takes 15–25 seconds.</p>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-card transition-colors duration-150 ease-out hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
        >
          {busy ? "Scoring…" : "Score this lead"}
          {!busy && (
            <svg
              aria-hidden
              viewBox="0 0 16 16"
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 8h9.5M8.5 4l4 4-4 4" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}

function Field({
  name,
  value,
  error,
  required = false,
  onChange,
}: {
  name: FieldName;
  value: string;
  error?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  const config = FIELDS[name];
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  const shared = {
    id: name,
    name,
    value,
    placeholder: config.placeholder,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : config.hint ? hintId : undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    className: [
      "w-full rounded-control border bg-surface px-3 py-2 text-[0.9375rem] leading-relaxed",
      "shadow-card transition-colors duration-150 ease-out placeholder:text-ink-3",
      "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
      error ? "border-disqualified" : "border-line hover:border-ink-3",
    ].join(" "),
  };

  return (
    <div className={config.half ? "" : "sm:col-span-2"}>
      <label
        htmlFor={name}
        className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium tracking-[-0.01em]"
      >
        {config.label}
        {!required && <span className="text-xs font-normal text-ink-3">optional</span>}
      </label>

      {config.hint && (
        <p id={hintId} className="mt-1 text-sm leading-relaxed text-ink-2">
          {config.hint}
        </p>
      )}

      <div className="mt-1.5">
        {config.multiline ? (
          <textarea {...shared} rows={config.rows ?? 3} />
        ) : (
          <input {...shared} type="text" />
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-disqualified">
          {error}
        </p>
      )}
    </div>
  );
}
