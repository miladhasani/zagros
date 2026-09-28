import { PageHeader } from "@/components/molecules";
import { BuildingForm } from "@/components/organisms/BuildingForm";
import { requireSuperAdmin, getBuilding } from "@/lib/session";

export default async function BuildingSettingsPage() {
  await requireSuperAdmin();
  const building = await getBuilding();
  if (!building) return <p>ساختمان یافت نشد.</p>;

  return (
    <>
      <PageHeader
        title="تنظیمات ساختمان"
        description="این نصب متعلق به یک مجتمع است. نام و واحد پول را اینجا تغییر دهید."
      />
      <BuildingForm name={building.name} address={building.address} currency={building.currency} />
    </>
  );
}
