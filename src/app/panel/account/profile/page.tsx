import { Badge, Button, Card } from "@/components/atoms";
import { PageHeader } from "@/components/molecules";
import { ProfileForm } from "@/components/organisms/ProfileForm";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function ProfilePage() {
  const user = await requireUser();
  const unitRoles = await prisma.userUnitRole.findMany({
    where: { userId: user.id },
    include: { unit: true },
    orderBy: { unit: { number: "asc" } },
  });

  const roles: string[] = [];
  if (user.isSuperAdmin) roles.push("مدیرکل");
  if (user.isAdmin) roles.push("هیئت مدیره");
  if (unitRoles.some((row) => row.role === "OWNER")) roles.push("مالک");
  if (unitRoles.some((row) => row.role === "TENANT")) roles.push("مستاجر");

  return (
    <>
      <PageHeader
        title="پروفایل"
        description="نام، موبایل، کد ملی و شماره کارت خود را ببینید و در صورت نیاز ویرایش کنید. نقش‌ها توسط مدیر تعیین می‌شوند."
        actions={<Button href="/panel/account/password" variant="outline">تغییر رمز عبور</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileForm
          key={user.id}
          firstName={user.firstName}
          lastName={user.lastName}
          phone={user.phone}
          phones={user.phones}
          nationalId={user.nationalId}
          cardNumbers={user.cardNumbers}
        />
        <Card>
          <h2 className="mb-4 text-lg font-semibold">نقش و واحدها</h2>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <Badge key={role} variant="accent">
                {role}
              </Badge>
            ))}
          </div>
          <div className="mt-5 grid gap-4 text-sm">
            <div>
              <p className="text-ink-muted">وضعیت حساب</p>
              <p className="mt-1">{user.isActive ? "فعال" : "غیرفعال"}</p>
            </div>
            <div>
              <p className="text-ink-muted">واحدهای مرتبط</p>
              <div className="mt-1">
                {unitRoles.length ? (
                  <ul className="space-y-1">
                    {unitRoles.map((row) => (
                      <li key={row.id}>
                        واحد {row.unit.number} — {row.role === "OWNER" ? "مالک" : "مستاجر"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-ink-faint">واحدی به این حساب وصل نشده است.</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
