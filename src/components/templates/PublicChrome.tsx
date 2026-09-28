import { Container } from "@/components/atoms";
import { FadeIn } from "@/motion";
import Link from "next/link";
import type { ReactNode } from "react";

export function PublicHeader({
  buildingName,
  loggedIn,
}: {
  buildingName: string;
  loggedIn: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
      <Container variant="landing" className="flex min-h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-accent text-sm text-white">
            س
          </span>
          <span className="truncate">{buildingName}</span>
        </Link>
        <Link
          href={loggedIn ? "/panel" : "/login"}
          className="inline-flex min-h-[var(--touch)] items-center rounded-[var(--radius-md)] bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover"
        >
          {loggedIn ? "ورود به پنل" : "ورود"}
        </Link>
      </Container>
    </header>
  );
}

export function PublicFooter({ buildingName }: { buildingName: string }) {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <Container variant="landing" className="py-6 text-center text-sm text-ink-faint">
        سامانه مدیریت {buildingName}
      </Container>
    </footer>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center bg-canvas px-4 py-10">
      <FadeIn className="mx-auto w-full max-w-md">{children}</FadeIn>
    </div>
  );
}
