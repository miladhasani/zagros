import { cn } from "@/lib/cn";
import { HoverLift } from "@/motion";
import type { ReactNode } from "react";

export function Card({
  children,
  className,
  hover = false,
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
}) {
  const body = (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm",
        padding && "p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
  if (!hover) return body;
  return <HoverLift>{body}</HoverLift>;
}
