"use client";

import { deleteUnitAction } from "@/actions/units";
import { Button } from "@/components/atoms";
import { DeleteButton } from "@/components/organisms/CmsForms";
import { DataTable } from "@/components/organisms/DataTable";
import { UnitForm, type UnitFormUser, type UnitFormValue } from "@/components/organisms/UnitForm";
import { useState } from "react";

export function UnitsBoard({
  units,
  users,
}: {
  units: UnitFormValue[];
  users: UnitFormUser[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = units.find((unit) => unit.id === editingId);

  return (
    <div className="grid gap-6">
      <UnitForm
        key={editing?.id ?? "new"}
        unit={editing}
        users={users}
        onCancel={editing ? () => setEditingId(null) : undefined}
      />
      <DataTable
        rows={units}
        rowKey={(row) => row.id}
        emptyTitle="واحدی ثبت نشده"
        mobileTitle={(row) => `واحد ${row.number}`}
        columns={[
          { key: "number", header: "شماره واحد", render: (row) => row.number },
          { key: "floor", header: "طبقه", render: (row) => row.floor ?? "—" },
          { key: "area", header: "متراژ", numeric: true, render: (row) => row.areaM2 ?? "—" },
          { key: "parking", header: "پارکینگ", render: (row) => String(row.parkingCount) },
          { key: "storage", header: "انباری", render: (row) => String(row.storageCount) },
          { key: "electricity", header: "شناسه برق", render: (row) => row.electricityBillId ?? "—" },
          { key: "gas", header: "شناسه گاز", render: (row) => row.gasBillId ?? "—" },
          { key: "water", header: "شناسه آب", render: (row) => row.waterBillId ?? "—" },
          {
            key: "owners",
            header: "مالک",
            render: (row) => names(users, row.ownerIds),
          },
          {
            key: "tenants",
            header: "مستاجر",
            render: (row) => names(users, row.tenantIds),
          },
          {
            key: "residents",
            header: "نفرات ساکن",
            render: (row) => (row.residentCount === 0 ? "۰ (خالی)" : String(row.residentCount)),
          },
          {
            key: "actions",
            header: "عملیات",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingId(row.id)}>
                  ویرایش
                </Button>
                <DeleteButton action={deleteUnitAction.bind(null, row.id)} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

function names(users: UnitFormUser[], ids: string[]) {
  if (!ids.length) return "—";
  return (
    ids
      .map((id) => {
        const user = users.find((item) => item.id === id);
        return user ? `${user.firstName} ${user.lastName}`.trim() : undefined;
      })
      .filter(Boolean)
      .join("، ") || "—"
  );
}
