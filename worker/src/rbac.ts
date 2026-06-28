import { error } from "./utils";
import type { User } from "./auth";

export type Role = "admin" | "user" | "viewer";

interface Permission {
  entity: string;
  action: "read" | "create" | "update" | "delete";
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    { entity: "*", action: "read" },
    { entity: "*", action: "create" },
    { entity: "*", action: "update" },
    { entity: "*", action: "delete" },
  ],
  user: [
    { entity: "*", action: "read" },
    { entity: "*", action: "create" },
    { entity: "*", action: "update" },
  ],
  viewer: [
    { entity: "*", action: "read" },
  ],
};

export function hasPermission(user: User, entity: string, action: "read" | "create" | "update" | "delete"): boolean {
  const permissions = ROLE_PERMISSIONS[user.role];
  if (!permissions) return false;

  return permissions.some((p) => (p.entity === "*" || p.entity === entity) && p.action === action);
}

export function authorizeAction(user: User, entity: string, action: "read" | "create" | "update" | "delete"): Response | null {
  if (!hasPermission(user, entity, action)) {
    return error(`Forbidden: ${user.role} cannot ${action} ${entity}`, 403);
  }
  return null;
}

export function canAccessEntity(user: User, entity: string): boolean {
  return hasPermission(user, entity, "read");
}
