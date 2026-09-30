import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("native Task entry", () => {
  it("has no Make shim or optional Makefile copies", () => {
    for (const path of [
      "Makefile",
      "profiles/README.md",
      "profiles/python-uv/Makefile",
      "profiles/typescript-node/Makefile",
      "profiles/terraform-gcp/Makefile",
    ]) {
      expect(existsSync(path), path).toBe(false);
    }
  });

  it("installs pinned Task before the Dev Container doctor", () => {
    const config = JSON.parse(
      readFileSync(".devcontainer/devcontainer.json", "utf8").replace(/^\s*\/\/.*$/gm, ""),
    );
    expect(config.postCreateCommand).toBe(
      "npm install -g @anthropic-ai/claude-code @go-task/cli@3.53.1 && task doctor",
    );
  });

  it("lists every canonical task without executing it", () => {
    const result = spawnSync("task", ["--list-all"], { encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);
    for (const task of [
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
    ]) {
      expect(result.stdout).toContain(`* ${task}:`);
    }
  });

  it("passes a quoted FILE unchanged to the formatter", () => {
    const directory = mkdtempSync(join(tmpdir(), "nextjs-native-task-"));
    try {
      const capture = join(directory, "capture");
      const tool = join(directory, "pnpm");
      writeFileSync(tool, '#!/bin/sh\nprintf "%s\\n" "$@" > "$CAPTURE_FILE"\n');
      chmodSync(tool, 0o755);
      const filename = 'file "quoted" `printf BAD`.ts';
      const result = spawnSync("task", ["format", `FILE=${filename}`], {
        encoding: "utf8",
        env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, CAPTURE_FILE: capture },
      });
      expect(result.status, result.stderr).toBe(0);
      expect(readFileSync(capture, "utf8").trim().split("\n")).toEqual([
        "exec",
        "prettier",
        "--write",
        filename,
      ]);
    } finally {
      rmSync(directory, { recursive: true });
    }
  });

  it("propagates tool failures without fallback", () => {
    const directory = mkdtempSync(join(tmpdir(), "nextjs-native-task-"));
    try {
      const tool = join(directory, "pnpm");
      writeFileSync(tool, "#!/bin/sh\nexit 23\n");
      chmodSync(tool, 0o755);
      const result = spawnSync("task", ["format", "FILE=sample.ts"], {
        encoding: "utf8",
        env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
      });
      expect(result.status).not.toBeNull();
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("exit status 23");
    } finally {
      rmSync(directory, { recursive: true });
    }
  });

  it("rejects an unknown task", () => {
    const result = spawnSync("task", ["unknown-test-task"], { encoding: "utf8" });
    expect(result.status).not.toBeNull();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("does not exist");
  });
});
