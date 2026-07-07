import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_PERMISSIONS, isPermission } from "@/shared/auth/permissions";

describe("permission vocabulary", () => {
  it("stays in sync with the Permission seed in the RLS migration", () => {
    const sql = readFileSync(
      path.resolve(__dirname, "../../../prisma/migrations/000000000001_rls/migration.sql"),
      "utf8",
    );
    const seeded = [...sql.matchAll(/\('([a-z]+:[a-z]+)',/g)].map((m) => m[1]);
    expect(seeded.length).toBeGreaterThan(0);
    expect([...seeded].sort()).toEqual([...ALL_PERMISSIONS].sort());
  });

  it("uses the scope:action shape for every permission", () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(permission).toMatch(/^[a-z]+:[a-z]+$/);
    }
  });

  it("narrows arbitrary strings with isPermission", () => {
    expect(isPermission("billing:write")).toBe(true);
    expect(isPermission("billing:steal")).toBe(false);
  });
});
