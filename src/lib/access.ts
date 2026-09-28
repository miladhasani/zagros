import { UnitRole } from "@prisma/client";

export type AppRole = "SUPER_ADMIN" | "ADMIN" | "OWNER" | "TENANT";

export type AccessUser = {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  unitRoles: { unitId: string; role: UnitRole; validTo: Date | null }[];
};

export type Access = {
  roles: Set<AppRole>;
  unitIds: string[];
  ownerUnitIds: string[];
  tenantUnitIds: string[];
  isStaff: boolean;
};

export function getAccess(user: AccessUser): Access {
  const roles = new Set<AppRole>();
  if (user.isSuperAdmin) roles.add("SUPER_ADMIN");
  if (user.isAdmin || user.isSuperAdmin) roles.add("ADMIN");

  const ownerUnitIds: string[] = [];
  const tenantUnitIds: string[] = [];

  for (const assignment of user.unitRoles) {
    if (assignment.validTo && assignment.validTo < new Date()) continue;
    if (assignment.role === "OWNER") {
      roles.add("OWNER");
      ownerUnitIds.push(assignment.unitId);
    }
    if (assignment.role === "TENANT") {
      roles.add("TENANT");
      tenantUnitIds.push(assignment.unitId);
    }
  }

  return {
    roles,
    ownerUnitIds,
    tenantUnitIds,
    unitIds: [...new Set([...ownerUnitIds, ...tenantUnitIds])],
    isStaff: roles.has("SUPER_ADMIN") || roles.has("ADMIN"),
  };
}

export function hasAnyRole(access: Access, allowed: AppRole[]) {
  return allowed.some((role) => access.roles.has(role));
}

export function canSeeReserve(access: Access) {
  return access.isStaff || access.roles.has("OWNER");
}

export function scopedUnitIds(access: Access) {
  if (access.isStaff) return null;
  return access.unitIds;
}
