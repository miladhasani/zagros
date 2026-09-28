import { PageHeader } from "@/components/molecules";
import { UsersBoard } from "@/components/organisms/UsersBoard";
import type { UserFormValue } from "@/components/organisms/UserForms";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export default async function UsersPage() {
  await requireAdmin();
  const [users, units] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { unitRoles: true },
    }),
    prisma.unit.findMany({ orderBy: { number: "asc" }, select: { id: true, number: true } }),
  ]);

  const rows: UserFormValue[] = users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    phones: user.phones,
    nationalId: user.nationalId,
    cardNumbers: user.cardNumbers,
    isAdmin: user.isAdmin,
    isSuperAdmin: user.isSuperAdmin,
    isActive: user.isActive,
    ownerUnitIds: user.unitRoles.filter((row) => row.role === "OWNER").map((row) => row.unitId),
    tenantUnitIds: user.unitRoles.filter((row) => row.role === "TENANT").map((row) => row.unitId),
  }));

  return (
    <>
      <PageHeader
        title="کاربران"
        description="فقط مدیرکل و هیئت مدیره می‌توانند کاربر بسازند. ثبت‌نام عمومی وجود ندارد."
      />
      <UsersBoard users={rows} units={units} />
    </>
  );
}
