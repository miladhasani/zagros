import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

const variants = {
  display: "text-3xl font-bold tracking-tight sm:text-4xl 3xl:text-5xl",
  title: "text-2xl font-bold tracking-tight sm:text-3xl",
  heading: "text-xl font-semibold tracking-tight",
  body: "text-base leading-7 text-ink",
  muted: "text-sm leading-6 text-ink-muted",
  caption: "text-xs text-ink-faint",
};

export function Text({
  as: Tag = "p",
  variant = "body",
  className,
  children,
}: {
  as?: "p" | "h1" | "h2" | "h3" | "span" | "div";
  variant?: keyof typeof variants;
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={cn(variants[variant], className)}>{children}</Tag>;
}
