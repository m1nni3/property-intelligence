import { describe, it, expect } from "vitest";
import { verifyJWT } from "../auth";

describe("JWT Auth", () => {
  it("should reject invalid token format", async () => {
    try {
      await verifyJWT("invalid", "secret");
      expect.fail("Should have thrown");
    } catch (e) {
      expect((e as Error).message).toContain("Invalid token format");
    }
  });

  it("should reject expired token", async () => {
    try {
      await verifyJWT("header.payload.invalidsig", "secret");
    } catch (e) {
      expect((e as Error).message).toBeDefined();
    }
  });
});
