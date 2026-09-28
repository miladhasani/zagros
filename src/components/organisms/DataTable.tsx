import { Badge } from "@/components/atoms";
import { EmptyState } from "@/components/molecules";
import { cn } from "@/lib/cn";
import { StaggerList } from "@/motion";
import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  numeric?: boolean;
  hideOnMobile?: boolean;
  render?: (row: T) => ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyTitle = "موردی یافت نشد",
  emptyDescription,
  mobileTitle,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  mobileTitle: (row: T) => ReactNode;
}) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-surface-muted text-ink-muted">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 font-medium",
                      col.numeric ? "text-left" : "text-right",
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={rowKey(row)} className="border-t border-border hover:bg-surface-muted/80">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-3 text-ink", col.numeric && "text-left tabular-nums")}
                    >
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <StaggerList className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <div key={rowKey(row)} className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-sm">
            <div className="mb-3 font-semibold text-ink">{mobileTitle(row)}</div>
            <dl className="grid gap-2">
              {columns
                .filter((col) => !col.hideOnMobile)
                .map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-3 text-sm">
                    <dt className="text-ink-muted">{col.header}</dt>
                    <dd className={cn("text-ink", col.numeric && "tabular-nums")}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>
        ))}
      </StaggerList>
    </>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "accent" | "success" | "warning" | "danger" }> = {
    DRAFT: { label: "پیش‌نویس", variant: "warning" },
    ISSUED: { label: "صادر شده", variant: "accent" },
    CLOSED: { label: "بسته", variant: "default" },
  };
  const item = map[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
