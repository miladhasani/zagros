import type { AppRole } from "@/lib/access";

export type MenuItem = {
  id: string;
  label: string;
  href?: string;
  icon: string;
  roles: AppRole[];
  children?: MenuItem[];
};

export const MENU: MenuItem[] = [
  {
    id: "debts",
    label: "وضعیت واحدها",
    href: "/panel/debts",
    icon: "wallet",
    roles: ["SUPER_ADMIN", "ADMIN", "OWNER", "TENANT"],
  },
  {
    id: "charges",
    label: "صورت‌حساب هزینه‌های شارژ",
    href: "/panel/charges",
    icon: "receipt",
    roles: ["SUPER_ADMIN", "ADMIN", "OWNER", "TENANT"],
  },
  {
    id: "reserve",
    label: "صورت‌حساب هزینه‌های صندوق ذخیره",
    href: "/panel/reserve",
    icon: "piggy",
    roles: ["SUPER_ADMIN", "ADMIN", "OWNER"],
  },
  {
    id: "my-unit",
    label: "واحد من",
    icon: "home",
    roles: ["OWNER", "TENANT"],
    children: [
      {
        id: "my-charge",
        label: "شارژ",
        href: "/panel/unit/charge",
        icon: "receipt",
        roles: ["OWNER", "TENANT"],
      },
      {
        id: "my-reserve",
        label: "صندوق ذخیره مالکین",
        href: "/panel/unit/reserve",
        icon: "piggy",
        roles: ["OWNER"],
      },
      {
        id: "my-info",
        label: "اطلاعات",
        href: "/panel/unit/info",
        icon: "info",
        roles: ["OWNER", "TENANT"],
      },
    ],
  },
  {
    id: "documents",
    label: "اسناد",
    href: "/panel/documents",
    icon: "file",
    roles: ["SUPER_ADMIN", "ADMIN", "OWNER", "TENANT"],
  },
  {
    id: "logs",
    label: "گزارش تغییرات",
    href: "/panel/logs",
    icon: "logs",
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    id: "account",
    label: "حساب کاربری",
    icon: "user",
    roles: ["SUPER_ADMIN", "ADMIN", "OWNER", "TENANT"],
    children: [
      {
        id: "profile",
        label: "پروفایل",
        href: "/panel/account/profile",
        icon: "user",
        roles: ["SUPER_ADMIN", "ADMIN", "OWNER", "TENANT"],
      },
      {
        id: "password",
        label: "تغییر رمز عبور",
        href: "/panel/account/password",
        icon: "key",
        roles: ["SUPER_ADMIN", "ADMIN", "OWNER", "TENANT"],
      },
    ],
  },
  {
    id: "manage",
    label: "مدیریت",
    icon: "settings",
    roles: ["SUPER_ADMIN", "ADMIN"],
    children: [
      {
        id: "users",
        label: "کاربران",
        href: "/panel/settings/users",
        icon: "users",
        roles: ["SUPER_ADMIN", "ADMIN"],
      },
      {
        id: "units",
        label: "واحدها",
        href: "/panel/settings/units",
        icon: "building",
        roles: ["SUPER_ADMIN", "ADMIN"],
      },
      {
        id: "charge-items",
        label: "شارژ و امکانات",
        href: "/panel/settings/charges",
        icon: "sliders",
        roles: ["SUPER_ADMIN", "ADMIN"],
      },
      {
        id: "billing",
        label: "صدور شارژ واحدها",
        href: "/panel/billing",
        icon: "invoice",
        roles: ["SUPER_ADMIN", "ADMIN"],
      },
      {
        id: "billing-reserve",
        label: "صدور صندوق ذخیره",
        href: "/panel/billing/reserve",
        icon: "piggy",
        roles: ["SUPER_ADMIN", "ADMIN"],
      },
      {
        id: "lists",
        label: "فهرست‌ها",
        href: "/panel/settings/lists",
        icon: "list",
        roles: ["SUPER_ADMIN", "ADMIN"],
      },
      {
        id: "landing-cms",
        label: "محتوای صفحه اصلی",
        href: "/panel/settings/landing",
        icon: "megaphone",
        roles: ["SUPER_ADMIN", "ADMIN"],
      },
      {
        id: "building",
        label: "تنظیمات ساختمان",
        href: "/panel/settings/building",
        icon: "cog",
        roles: ["SUPER_ADMIN"],
      },
    ],
  },
];

export function filterMenu(items: MenuItem[], roles: Set<AppRole>): MenuItem[] {
  return items
    .map((item) => {
      const children = item.children ? filterMenu(item.children, roles) : undefined;
      const selfVisible = item.roles.some((role) => roles.has(role));
      if (!selfVisible && (!children || children.length === 0)) return null;
      if (item.children) {
        if (!children?.length) return null;
        return { ...item, children };
      }
      return item;
    })
    .filter((item): item is MenuItem => item !== null);
}
