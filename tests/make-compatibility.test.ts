import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const targets = [
  "help",
  "setup",
  "format",
  "lint",
  "test",
  "test-unit",
  "test-integration",
  "coverage",
  "build",
  "run",
  "security-scan",
  "sbom",
  "clean",
  "doctor",
];

describe("temporary Make compatibility", () => {
  it.each(targets)("%s has one Task command and no independent implementation", (target) => {
    const result = spawnSync("make", ["--no-print-directory", "-n", target], {
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(result.stdout.trim().split("\n")).toHaveLength(1);
    expect(result.stdout).toContain(`task "${target}"`);
  });

  it("passes a quoted FILE as one Task variable", () => {
    const directory = mkdtempSync(join(tmpdir(), "nextjs-task-shim-"));
    try {
      const capture = join(directory, "capture");
      const fakeTask = join(directory, "task");
      writeFileSync(fakeTask, '#!/bin/sh\nprintf "%s\\n" "$@" > "$CAPTURE_FILE"\n');
      chmodSync(fakeTask, 0o755);
      const filename = "file ' quoted.ts";
      const result = spawnSync("make", ["--no-print-directory", "format", `FILE=${filename}`], {
        encoding: "utf8",
        env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, CAPTURE_FILE: capture },
      });
      expect(result.status).toBe(0);
      expect(readFileSync(capture, "utf8").trim().split("\n")).toEqual([
        "format",
        `FILE=${filename}`,
      ]);
    } finally {
      rmSync(directory, { recursive: true });
    }
  });

  it("propagates Task failures", () => {
    const directory = mkdtempSync(join(tmpdir(), "nextjs-task-shim-"));
    try {
      const fakeTask = join(directory, "task");
      writeFileSync(fakeTask, "#!/bin/sh\nexit 23\n");
      chmodSync(fakeTask, 0o755);
      const result = spawnSync("make", ["--no-print-directory", "help"], {
        encoding: "utf8",
        env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
      });
      expect(result.status).not.toBe(0);
    } finally {
      rmSync(directory, { recursive: true });
    }
  });
});
