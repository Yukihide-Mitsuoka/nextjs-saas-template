import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/ci.yml", "utf8");

function job(name: string): string {
  const marker = `  ${name}:\n`;
  const start = workflow.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const rest = workflow.slice(start + marker.length);
  const next = rest.search(/^  [a-z][a-z-]*:\n/m);
  return next < 0 ? rest : rest.slice(0, next);
}

describe("Task CI migration", () => {
  it.each([
    ["lint", ["setup", "lint"]],
    ["test", ["setup", "coverage"]],
    ["build", ["setup", "build"]],
    ["doctor", ["doctor"]],
  ])("installs Task before canonical commands in %s", (name, expected) => {
    const steps = job(name);
    const action = "uses: ./scripts/actions/setup-task";
    expect(steps.split(action)).toHaveLength(2);
    expect(steps.indexOf("uses: actions/checkout@")).toBeLessThan(steps.indexOf(action));
    expect(steps.indexOf(action)).toBeLessThan(steps.indexOf("run: task "));
    expect([...steps.matchAll(/- run: task ([a-z-]+)/g)].map((match) => match[1])).toEqual(
      expected,
    );
    expect(steps).not.toContain("- run: make ");
  });
});
