// Marqai — RBAC engine
// Permission checks, role utilities, and principal helpers.

import type {
  AuthPrincipal,
  ModuleId,
  PermissionLevel,
  PermissionMatrix,
  Role,
} from "./types";
import { BUILT_IN_ROLES } from "./saas";

// ============================================================
// PERMISSION RANKING
// ============================================================

const RANK: Record<PermissionLevel, number> = {
  none: 0,
  view: 1,
  execute: 2,
  manage: 3,
};

/** Returns true if `granted` is at least `required`. */
export function hasPermission(
  granted: PermissionLevel | undefined,
  required: PermissionLevel,
): boolean {
  if (!granted) return false;
  return RANK[granted] >= RANK[required];
}

/** Returns the permission level for a module, default "none". */
export function getPermission(
  matrix: PermissionMatrix | undefined,
  moduleId: ModuleId,
): PermissionLevel {
  return matrix?.[moduleId] ?? "none";
}

// ============================================================
// PRINCIPAL HELPERS
// ============================================================

/** Returns true if the principal can access the given module at the given level. */
export function canAccess(
  principal: AuthPrincipal | null | undefined,
  moduleId: ModuleId,
  required: PermissionLevel = "view",
): boolean {
  if (!principal) return false;

  // Super Admin bypasses everything.
  if (principal.kind === "super_admin") return true;

  const level = getPermission(principal.permissions, moduleId);
  return hasPermission(level, required);
}

/** Returns true if the principal can manage organization-wide settings. */
export function isOrgAdmin(principal: AuthPrincipal | null | undefined): boolean {
  if (!principal) return false;
  if (principal.kind === "super_admin") return true;
  return canAccess(principal, "roles", "manage") || canAccess(principal, "billing", "manage");
}

/** Returns true if the principal can manage team members. */
export function canManageTeam(principal: AuthPrincipal | null | undefined): boolean {
  return canAccess(principal, "team", "manage");
}

// ============================================================
// ROLE HELPERS
// ============================================================

/** Convert a Role's permission map to a serializable PermissionMatrix. */
export function roleToMatrix(role: Pick<Role, "permissions">): PermissionMatrix {
  return role.permissions;
}

/** Create an empty permission matrix (all modules "none"). */
export function emptyMatrix(): PermissionMatrix {
  return {};
}

/** Create a "full access" matrix (every module "manage"). */
export function fullMatrix(modules: ModuleId[]): PermissionMatrix {
  const m: PermissionMatrix = {};
  for (const mod of modules) m[mod] = "manage";
  return m;
}

/** Count how many modules a role has any access to. */
export function countAccessibleModules(role: Pick<Role, "permissions">): number {
  return Object.values(role.permissions).filter((v) => v && v !== "none").length;
}

/** Returns a human-readable summary of a role's reach. */
export function summarizeRole(role: Pick<Role, "permissions">): string {
  const count = countAccessibleModules(role);
  const manageCount = Object.values(role.permissions).filter((v) => v === "manage").length;
  if (manageCount >= 10) return "Full access";
  if (count === 0) return "No access";
  if (manageCount === 0) return `View-only · ${count} modules`;
  return `${count} modules · ${manageCount} with manage`;
}

// ============================================================
// SYSTEM-LEVEL ROLE FACTORY
// ============================================================

/**
 * Materialize the built-in roles for a fresh Organization.
 * The Org Owner role is locked and cannot be deleted.
 */
export function seedBuiltInRoles(orgId: string): Role[] {
  const now = new Date().toISOString();
  return BUILT_IN_ROLES.map((seed, idx) => ({
    id: `${orgId}-role-${idx + 1}`,
    name: seed.name,
    description: seed.description,
    scope: "organization" as const,
    permissions: seed.permissions,
    isSystem: true,
    isLocked: seed.isLocked ?? false,
    color: seed.color,
    createdAt: now,
  }));
}

/** Create a brand-new custom role with an empty permission matrix. */
export function createCustomRole(
  orgId: string,
  name: string,
  description?: string,
  color: string = "emerald",
): Role {
  return {
    id: `${orgId}-role-${Date.now()}`,
    name,
    description,
    scope: "organization",
    permissions: {},
    isSystem: false,
    isLocked: false,
    color,
    createdAt: new Date().toISOString(),
  };
}
