import { DateSpan } from "@/components/atoms";
import { PageHeader } from "@/components/molecules";
import { DataTable } from "@/components/organisms/DataTable";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/user";
import { requireAdmin } from "@/lib/session";

export default async function LogsPage() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: true },
  });

  return (
    <>
      <PageHeader
        title="گزارش تغییرات"
        description="ثبت تغییرات کاربران برای شفافیت مدیریت ساختمان."
      />
      <DataTable
        rows={logs}
        rowKey={(row) => row.id}
        emptyTitle="هنوز تغییری ثبت نشده"
        mobileTitle={(row) => `${row.action} / ${row.entity}`}
        columns={[
          { key: "date", header: "زمان", render: (row) => <DateSpan value={row.createdAt} withTime /> },
          { key: "actor", header: "کاربر", render: (row) => (row.actor ? displayName(row.actor) : "سامانه") },
          { key: "action", header: "عملیات", render: (row) => row.action },
          { key: "entity", header: "موجودیت", render: (row) => row.entity },
        ]}
      />
    </>
  );
}
