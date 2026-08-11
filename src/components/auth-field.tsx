/**
 * A labelled input for the auth screens.
 *
 * Same shape as the fields in `lead-form.tsx`. Kept separate rather than
 * shared: that form's `Field` is bound to `LEAD_FIELDS` and its own copy, and
 * generalising it to serve a password box would make the lead form harder to
 * read for the sake of four inputs.
 */

export function AuthField({
  name,
  label,
  type = "text",
  autoComplete,
  required = true,
  defaultValue,
  autoFocus = false,
}: {
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  required?: boolean;
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium tracking-[-0.01em]">
        {label}
      </label>
      <div className="mt-1.5">
        <input
          id={name}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required={required}
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          className="w-full rounded-control border border-line bg-surface px-3 py-2 text-[0.9375rem] leading-relaxed shadow-card transition-colors duration-150 ease-out placeholder:text-ink-3 hover:border-ink-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-control bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary shadow-card transition-colors duration-150 ease-out hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}
