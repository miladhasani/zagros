import { SetupForm } from "@/components/organisms/SetupForm";
import { getBuilding, requireSuperAdmin } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SetupPage() {
  await requireSuperAdmin();
  const building = await getBuilding();
  if (building?.setupComplete) redirect("/panel");
  return <SetupForm defaultName={building?.name ?? ""} />;
}
