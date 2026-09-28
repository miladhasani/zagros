import {
  Building2,
  CalendarDays,
  ChevronDown,
  Columns3,
  ChevronLeft,
  ChevronRight,
  CircleUser,
  ClipboardList,
  Cog,
  FileText,
  Home,
  Info,
  KeyRound,
  LayoutDashboard,
  List,
  LogOut,
  Megaphone,
  Menu,
  PiggyBank,
  Receipt,
  Settings2,
  SlidersHorizontal,
  Users,
  Wallet,
  Plus,
  Printer,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

const icons = {
  wallet: Wallet,
  receipt: Receipt,
  piggy: PiggyBank,
  home: Home,
  info: Info,
  key: KeyRound,
  user: CircleUser,
  file: FileText,
  invoice: ClipboardList,
  list: List,
  logs: LayoutDashboard,
  settings: Settings2,
  users: Users,
  building: Building2,
  sliders: SlidersHorizontal,
  megaphone: Megaphone,
  cog: Cog,
  menu: Menu,
  close: X,
  chevron: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  calendar: CalendarDays,
  columns: Columns3,
  printer: Printer,
  plus: Plus,
  logout: LogOut,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const Cmp = icons[name] ?? FileText;
  return <Cmp className={cn("size-5 shrink-0", className)} strokeWidth={1.75} />;
}
