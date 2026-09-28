import { cn } from "@/lib/cn";
import { faDate, faDateTime } from "@/lib/format";

export function DateSpan({
  value,
  withTime = false,
  fallback = "—",
  className,
}: {
  value?: Date | string | null;
  withTime?: boolean;
  fallback?: string;
  className?: string;
}) {
  const text = withTime ? faDateTime(value) : faDate(value);
  if (!text) {
    return <span className={className}>{fallback}</span>;
  }
  const numeric = /^[\d\u06F0-\u06F9/\-.\s:]+$/.test(text);
  return (
    <span className={cn("inline-block tabular-nums", className)} dir={numeric ? "ltr" : "rtl"}>
      {text}
    </span>
  );
}
