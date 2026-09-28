import { PanelShell } from "@/components/templates/PanelLayout";
import { Card } from "@/components/atoms";
import { getAccess } from "@/lib/access";
import { filterMenu, MENU } from "@/lib/menu";
import { getBuilding, getSessionUser } from "@/lib/session";
import { displayName } from "@/lib/user";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function PanelRootLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.mustSetPassword) redirect("/login/set-password");

  const building = await getBuilding();
  const access = getAccess(user);

  if (!building?.setupComplete && !user.isSuperAdmin) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <Card className="max-w-md text-center">
          <h1 className="text-xl font-bold">سامانه در حال راه‌اندازی است</h1>
          <p className="mt-2 text-sm text-ink-muted">لطفاً بعداً مراجعه کنید.</p>
        </Card>
      </div>
    );
  }

  return (
    <PanelShell
      items={filterMenu(MENU, access.roles)}
      buildingName={building?.name ?? "ساختمان"}
      userName={displayName(user)}
    >
      {children}
    </PanelShell>
  );
}
