import { getBuilding, requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function PanelHome() {
  const user = await requireUser();
  const building = await getBuilding();
  if (!building?.setupComplete && user.isSuperAdmin) redirect("/panel/setup");
  redirect("/panel/debts");
}
