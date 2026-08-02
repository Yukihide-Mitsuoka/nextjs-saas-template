import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/release.yml", "utf8");

describe("release workflow", () => {
  it("provides the public Clerk placeholder only to the release gates", () => {
    const releaseGates = "uses: ./scripts/actions/release-gates";
    const publicPlaceholder =
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: " +
      "${{ format('pk_test_{0}', 'Y2xlcmsuZXhhbXBsZS5jb20k') }}";

    expect(workflow).toContain(releaseGates);
    expect(workflow).toContain(publicPlaceholder);
    expect(workflow.indexOf(publicPlaceholder)).toBeGreaterThan(workflow.indexOf(releaseGates));
    expect(workflow).not.toContain("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pk_test_");
  });
});
