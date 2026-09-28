import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function Container({
  children,
  variant = "panel",
  className,
}: {
  children: ReactNode;
  variant?: "panel" | "landing";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        variant === "panel" && "max-w-[var(--container-panel)]",
        variant === "landing" && "max-w-[var(--container-landing)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
