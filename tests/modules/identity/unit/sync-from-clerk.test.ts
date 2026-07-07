import { describe, expect, it, vi } from "vitest";
import { DEFAULT_ROLES, SYSTEM_ROLE_NAMES } from "@/modules/identity/application/default-roles";
import type { IdentitySyncRepository } from "@/modules/identity/application/ports";
import { syncFromClerk } from "@/modules/identity/application/sync-from-clerk";
import { mapProviderRole } from "@/modules/identity/domain/types";
import { ALL_PERMISSIONS } from "@/shared/auth/permissions";

function fakeRepository(): IdentitySyncRepository {
  return {
    upsertUser: vi.fn(async () => {}),
    deleteUser: vi.fn(async () => {}),
    upsertOrganization: vi.fn(async () => {}),
    deleteOrganization: vi.fn(async () => {}),
    upsertMembership: vi.fn(async () => {}),
    deleteMembership: vi.fn(async () => {}),
  };
}

describe("syncFromClerk", () => {
  it("routes user events to user upserts/deletes", async () => {
    const repo = fakeRepository();
    const user = { clerkUserId: "u_1", email: "a@example.com", name: null, imageUrl: null };
    await syncFromClerk({ type: "user.created", user }, repo);
    await syncFromClerk({ type: "user.deleted", clerkUserId: "u_1" }, repo);
    expect(repo.upsertUser).toHaveBeenCalledWith(user);
    expect(repo.deleteUser).toHaveBeenCalledWith("u_1");
  });

  it("seeds the system roles on organization events (invariant 3)", async () => {
    const repo = fakeRepository();
    const organization = {
      clerkOrgId: "org_1",
      name: "Acme",
      slug: "acme",
      createdByClerkUserId: "u_1",
    };
    await syncFromClerk({ type: "organization.created", organization }, repo);
    expect(repo.upsertOrganization).toHaveBeenCalledWith(organization, DEFAULT_ROLES);
  });

  it("maps provider roles without ever producing Owner (invariant 2)", async () => {
    expect(mapProviderRole("org:admin")).toBe("Admin");
    expect(mapProviderRole("org:member")).toBe("Member");
    expect(mapProviderRole("org:custom_thing")).toBe("Member");

    const repo = fakeRepository();
    const membership = { clerkOrgId: "org_1", clerkUserId: "u_1", providerRole: "org:admin" };
    await syncFromClerk({ type: "organizationMembership.created", membership }, repo);
    expect(repo.upsertMembership).toHaveBeenCalledWith(membership, "Admin");
  });
});

describe("DEFAULT_ROLES", () => {
  it("defines exactly the five system roles", () => {
    expect([...SYSTEM_ROLE_NAMES].sort()).toEqual(
      ["Admin", "Billing", "Manager", "Member", "Owner"].sort(),
    );
  });

  it("grants Owner every permission and others a strict subset", () => {
    expect([...DEFAULT_ROLES.Owner].sort()).toEqual([...ALL_PERMISSIONS].sort());
    for (const name of SYSTEM_ROLE_NAMES.filter((n) => n !== "Owner")) {
      expect(DEFAULT_ROLES[name].length).toBeLessThan(ALL_PERMISSIONS.length);
    }
  });

  it("keeps billing writes exclusive to Owner and Billing", () => {
    const withBillingWrite = SYSTEM_ROLE_NAMES.filter((name) =>
      DEFAULT_ROLES[name].includes("billing:write"),
    );
    expect(withBillingWrite.sort()).toEqual(["Billing", "Owner"]);
  });
});
