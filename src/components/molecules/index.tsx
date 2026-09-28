import { MultiValueField } from "./MultiValueField";
import { KeyAmountField } from "./KeyAmountField";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export { MultiValueField, KeyAmountField };
export type { KeyAmountRow } from "./KeyAmountField";

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5 text-sm">
      <label htmlFor={htmlFor} className="font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error ? <span className="text-xs text-ink-faint">{hint}</span> : null}
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-muted sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-muted px-6 py-12 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "danger" | "success";
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm">
      <p className="text-sm text-ink-muted">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tracking-tight",
          tone === "danger" && "text-danger",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-ink-faint">{hint}</p> : null}
    </div>
  );
}
