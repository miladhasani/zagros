"use client";

import { cn } from "@/lib/cn";
import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium min-h-[var(--touch)] px-4 text-sm transition-[color,background-color,border-color,transform] duration-[var(--duration-fast)] disabled:pointer-events-none disabled:opacity-50 motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white shadow-sm hover:bg-accent-hover",
        secondary: "bg-accent-soft text-accent-ink hover:bg-teal-100",
        outline: "border border-border-strong bg-surface text-ink hover:bg-surface-muted",
        ghost: "text-ink-muted hover:bg-surface-muted hover:text-ink",
        danger: "bg-danger text-white hover:bg-red-700",
      },
      size: {
        sm: "min-h-10 px-3 text-sm",
        md: "min-h-[var(--touch)] px-4",
        lg: "min-h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    href?: string;
    children: ReactNode;
  };

export function Button({
  className,
  variant,
  size,
  href,
  children,
  type = "button",
  onDrag: _onDrag,
  onDragStart: _onDragStart,
  onDragEnd: _onDragEnd,
  onAnimationStart: _onAnimationStart,
  ...props
}: Props) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}

export { buttonVariants };
