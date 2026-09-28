"use client";

import { Button, Icon, type IconName } from "@/components/atoms";
import { cn } from "@/lib/cn";
import type { MenuItem } from "@/lib/menu";
import { Collapse, useSafeReducedMotion } from "@/motion";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

function isActive(pathname: string, href?: string) {
  if (!href) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLeaf({
  item,
  collapsed,
  onNavigate,
}: {
  item: MenuItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href ?? "#"}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex min-h-[var(--touch)] items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm transition-colors duration-[var(--duration-fast)]",
        active ? "bg-accent-soft text-accent-ink" : "text-ink-muted hover:bg-surface-muted hover:text-ink",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon name={item.icon as IconName} className="size-[1.15rem]" />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

function NavGroup({
  item,
  collapsed,
  onNavigate,
}: {
  item: MenuItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const childActive = item.children?.some((child) => isActive(pathname, child.href));
  const [open, setOpen] = useState(Boolean(childActive));

  if (!item.children?.length) return <NavLeaf item={item} collapsed={collapsed} onNavigate={onNavigate} />;

  if (collapsed) {
    return (
      <div className="grid gap-1">
        {item.children.map((child) => (
          <NavLeaf key={child.id} item={child} collapsed onNavigate={onNavigate} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex min-h-[var(--touch)] w-full items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm",
          childActive ? "text-accent-ink" : "text-ink-muted hover:bg-surface-muted hover:text-ink",
        )}
      >
        <Icon name={item.icon as IconName} className="size-[1.15rem]" />
        <span className="flex-1 truncate text-right">{item.label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="inline-flex">
          <Icon name="chevron" className="size-4" />
        </motion.span>
      </button>
      <Collapse open={open}>
        <div className="mt-1 mr-4 grid gap-1 border-r border-border pr-2">
          {item.children.map((child) => (
            <NavLeaf key={child.id} item={child} collapsed={false} onNavigate={onNavigate} />
          ))}
        </div>
      </Collapse>
    </div>
  );
}

export function Sidebar({
  items,
  buildingName,
  userName,
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}: {
  items: MenuItem[];
  buildingName: string;
  userName: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}) {
  const reduce = useSafeReducedMotion();
  const desktopWidth = collapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)";

  const body = (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-3 px-3 py-4", collapsed && "justify-center px-2")}>
        <div className="flex size-10 items-center justify-center rounded-2xl bg-accent text-white shadow-sm">
          <Icon name="building" className="size-5" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{buildingName}</p>
            <p className="truncate text-xs text-ink-faint">{userName}</p>
          </div>
        ) : null}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {items.map((item) => (
          <NavGroup key={item.id} item={item} collapsed={collapsed} onNavigate={onCloseMobile} />
        ))}
      </nav>
      <div className="hidden border-t border-border p-2 lg:block">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex min-h-10 w-full items-center justify-center rounded-[var(--radius-md)] text-ink-muted hover:bg-surface-muted"
        >
          {collapsed ? "»" : "« جمع شدن منو"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <motion.div
        className={cn(
          "fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm print:hidden lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        animate={{ opacity: mobileOpen ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : 0.25 }}
        onClick={onCloseMobile}
      />
      <motion.aside
        className="fixed inset-y-0 right-0 z-50 w-[min(18rem,88vw)] border-l border-border bg-surface shadow-lg print:hidden lg:hidden"
        initial={false}
        animate={{ x: mobileOpen ? 0 : "110%" }}
        transition={{ duration: reduce ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex justify-start p-2">
          <Button variant="ghost" size="sm" onClick={onCloseMobile} aria-label="بستن منو">
            <Icon name="close" />
          </Button>
        </div>
        {body}
      </motion.aside>
      <motion.aside
        className="sticky top-0 hidden h-dvh shrink-0 overflow-hidden border-l border-border bg-surface print:hidden lg:block"
        initial={false}
        animate={{ width: desktopWidth }}
        transition={{ duration: reduce ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {body}
      </motion.aside>
    </>
  );
}
