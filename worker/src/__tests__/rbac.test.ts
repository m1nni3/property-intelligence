import { describe, it, expect } from "vitest";
import { hasPermission, canAccessEntity } from "../rbac";
import type { User } from "../auth";

describe("RBAC (Role-Based Access Control)", () => {
  const adminUser: User = {
    id: "admin-1",
    email: "admin@example.com",
    role: "admin",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const regularUser: User = {
    id: "user-1",
    email: "user@example.com",
    role: "user",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const viewerUser: User = {
    id: "viewer-1",
    email: "viewer@example.com",
    role: "viewer",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  it("admin should have all permissions", () => {
    expect(hasPermission(adminUser, "properties", "read")).toBe(true);
    expect(hasPermission(adminUser, "properties", "create")).toBe(true);
    expect(hasPermission(adminUser, "properties", "update")).toBe(true);
    expect(hasPermission(adminUser, "properties", "delete")).toBe(true);
  });

  it("user should not have delete permission", () => {
    expect(hasPermission(regularUser, "properties", "read")).toBe(true);
    expect(hasPermission(regularUser, "properties", "create")).toBe(true);
    expect(hasPermission(regularUser, "properties", "update")).toBe(true);
    expect(hasPermission(regularUser, "properties", "delete")).toBe(false);
  });

  it("viewer should only have read permission", () => {
    expect(hasPermission(viewerUser, "properties", "read")).toBe(true);
    expect(hasPermission(viewerUser, "properties", "create")).toBe(false);
    expect(hasPermission(viewerUser, "properties", "update")).toBe(false);
    expect(hasPermission(viewerUser, "properties", "delete")).toBe(false);
  });

  it("should check entity access", () => {
    expect(canAccessEntity(adminUser, "properties")).toBe(true);
    expect(canAccessEntity(regularUser, "properties")).toBe(true);
    expect(canAccessEntity(viewerUser, "properties")).toBe(true);
  });
});
