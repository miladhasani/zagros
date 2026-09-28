"use client";

import { cn } from "@/lib/cn";
import { motion, useReducedMotion } from "motion/react";
import { Children, useEffect, useState, type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

/** `useReducedMotion()` is `null` on the server and resolved on the client — only read it after mount. */
export function useSafeReducedMotion() {
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready && reduce === true;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  y = 16,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useSafeReducedMotion();
  return (
    <motion.div
      className={className}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.45, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <FadeIn className={className} y={12}>
      {children}
    </FadeIn>
  );
}

export function StaggerList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useSafeReducedMotion();
  return (
    <motion.div
      className={className}
      initial={false}
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduce ? 0 : 0.07 } },
      }}
    >
      {Children.map(children, (child) => (
        <motion.div
          initial={false}
          variants={{
            hidden: { opacity: 1, y: 0 },
            show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const reduce = useSafeReducedMotion();
  return (
    <motion.div
      initial={false}
      animate={{
        height: open ? "auto" : 0,
        opacity: open ? 1 : 0,
      }}
      transition={{ duration: reduce ? 0 : 0.28, ease }}
      style={{ overflow: "hidden" }}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({
  children,
  className,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const reduce = useSafeReducedMotion();
  return (
    <motion.div
      className={className}
      whileHover={disabled || reduce ? undefined : { y: -4 }}
      transition={{ duration: 0.28, ease }}
    >
      {children}
    </motion.div>
  );
}

export function ModalPresence({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  const reduce = useSafeReducedMotion();
  return (
    <motion.div
      initial={false}
      animate={open ? { opacity: 1, pointerEvents: "auto" } : { opacity: 0, pointerEvents: "none" }}
      transition={{ duration: reduce ? 0 : 0.22 }}
      className={cn("fixed inset-0 z-50", open ? "" : "invisible")}
    >
      {children}
    </motion.div>
  );
}
