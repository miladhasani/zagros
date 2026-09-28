"use client";

import { Button, Container, Icon } from "@/components/atoms";
import { Sidebar } from "@/components/organisms/Sidebar";
import type { MenuItem } from "@/lib/menu";
import { signOut } from "next-auth/react";
import { useState } from "react";

export function PanelShell({
  items,
  buildingName,
  userName,
  children,
}: {
  items: MenuItem[];
  buildingName: string;
  userName: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar
        items={items}
        buildingName={buildingName}
        userName={userName}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur print:hidden">
          <Container className="flex min-h-14 items-center justify-between gap-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="باز کردن منو"
            >
              <Icon name="menu" />
            </Button>
            <p className="truncate text-sm font-medium text-ink-muted">{buildingName}</p>
            <div className="flex items-center gap-1">
              <Button href="/panel/account/profile" variant="ghost" size="sm">
                <Icon name="user" className="size-4" />
                <span className="hidden sm:inline">پروفایل</span>
              </Button>
              <Button href="/panel/account/password" variant="ghost" size="sm">
                <Icon name="key" className="size-4" />
                <span className="hidden sm:inline">تغییر رمز</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <Icon name="logout" className="size-4" />
                خروج
              </Button>
            </div>
          </Container>
        </header>
        <main className="flex-1 py-6 sm:py-8 print:py-0">
          <Container>{children}</Container>
        </main>
      </div>
    </div>
  );
}
