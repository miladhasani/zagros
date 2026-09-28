import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccess, type Access } from "@/lib/access";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { unitRoles: true },
  });
  if (!user || !user.isActive) return null;
  return user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.mustSetPassword) redirect("/login/set-password");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin && !user.isSuperAdmin) redirect("/panel");
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (!user.isSuperAdmin) redirect("/panel");
  return user;
}

export async function getBuilding() {
  return prisma.building.findFirst();
}

export async function userWithAccess() {
  const user = await requireUser();
  const access: Access = getAccess(user);
  const building = await getBuilding();
  return { user, access, building };
}
