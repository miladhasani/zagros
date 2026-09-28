import { deleteDocumentAction } from "@/actions/documents";
import { PageHeader } from "@/components/molecules";
import { DeleteButton, DocumentForm } from "@/components/organisms/CmsForms";
import { DataTable } from "@/components/organisms/DataTable";
import { DateSpan } from "@/components/atoms";
import { prisma } from "@/lib/prisma";
import { userWithAccess } from "@/lib/session";

export default async function DocumentsPage() {
  const { access } = await userWithAccess();
  const docs = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: true },
  });

  return (
    <>
      <PageHeader
        title="اسناد"
        description="اسناد مهم ساختمان برای مشاهده ساکنین."
      />
      {access.isStaff ? (
        <div className="mb-6">
          <DocumentForm />
        </div>
      ) : null}
      <DataTable
        rows={docs}
        rowKey={(row) => row.id}
        emptyTitle="سندی بارگذاری نشده"
        mobileTitle={(row) => row.title}
        columns={[
          { key: "title", header: "عنوان", render: (row) => row.title },
          {
            key: "date",
            header: "تاریخ",
            render: (row) => <DateSpan value={row.createdAt} />,
          },
          {
            key: "file",
            header: "فایل",
            render: (row) => (
              <a className="text-accent hover:underline" href={`/api/files?path=${encodeURIComponent(row.filePath)}`}>
                دانلود
              </a>
            ),
          },
          ...(access.isStaff
            ? [
                {
                  key: "actions",
                  header: "عملیات",
                  render: (row: (typeof docs)[number]) => (
                    <DeleteButton action={deleteDocumentAction.bind(null, row.id)} />
                  ),
                },
              ]
            : []),
        ]}
      />
    </>
  );
}
