import {
  deleteAnnouncementAction,
  deletePlanAction,
  deleteUtilityBillAction,
} from "@/actions/landing";
import { PageHeader } from "@/components/molecules";
import {
  AnnouncementForm,
  DeleteButton,
  FuturePlanForm,
  UtilityBillForm,
} from "@/components/organisms/CmsForms";
import { DateSpan } from "@/components/atoms";
import { DataTable } from "@/components/organisms/DataTable";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export default async function LandingCmsPage() {
  await requireAdmin();
  const [news, bills, plans] = await Promise.all([
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.utilityBill.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.futurePlan.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <>
      <PageHeader title="محتوای صفحه اصلی" description="اخبار، قبض‌ها و برنامه‌هایی که در صفحه عمومی دیده می‌شوند." />
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <AnnouncementForm />
        <UtilityBillForm />
        <FuturePlanForm />
      </div>
      <h2 className="mb-3 font-semibold">اخبار</h2>
      <DataTable
        rows={news}
        rowKey={(row) => row.id}
        emptyTitle="خبری نیست"
        mobileTitle={(row) => row.title}
        columns={[
          { key: "title", header: "عنوان", render: (row) => row.title },
          { key: "date", header: "تاریخ", render: (row) => <DateSpan value={row.createdAt} /> },
          {
            key: "actions",
            header: "عملیات",
            render: (row) => <DeleteButton action={deleteAnnouncementAction.bind(null, row.id)} />,
          },
        ]}
      />
      <h2 className="mt-8 mb-3 font-semibold">قبض‌ها</h2>
      <DataTable
        rows={bills}
        rowKey={(row) => row.id}
        emptyTitle="قبضی نیست"
        mobileTitle={(row) => row.type}
        columns={[
          { key: "type", header: "نوع", render: (row) => row.type },
          { key: "period", header: "دوره", render: (row) => <DateSpan value={row.periodLabel} /> },
          {
            key: "actions",
            header: "عملیات",
            render: (row) => <DeleteButton action={deleteUtilityBillAction.bind(null, row.id)} />,
          },
        ]}
      />
      <h2 className="mt-8 mb-3 font-semibold">برنامه‌ها</h2>
      <DataTable
        rows={plans}
        rowKey={(row) => row.id}
        emptyTitle="برنامه‌ای نیست"
        mobileTitle={(row) => row.title}
        columns={[
          { key: "title", header: "عنوان", render: (row) => row.title },
          { key: "date", header: "زمان", render: (row) => <DateSpan value={row.targetDate} /> },
          {
            key: "actions",
            header: "عملیات",
            render: (row) => <DeleteButton action={deletePlanAction.bind(null, row.id)} />,
          },
        ]}
      />
    </>
  );
}
