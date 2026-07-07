import { afterEach, describe, expect, it } from "vitest";
import { env, resetEnvCache } from "@/shared/lib/env";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
  resetEnvCache();
});

describe("env()", () => {
  it("applies defaults when optional variables are absent", () => {
    delete process.env.APP_ENV;
    delete process.env.LOG_LEVEL;
    delete process.env.APP_URL;
    expect(env()).toMatchObject({
      APP_ENV: "development",
      LOG_LEVEL: "info",
      APP_URL: "http://localhost:3000",
    });
  });

  it("rejects invalid enum values with a readable message", () => {
    process.env.APP_ENV = "prod"; // not a member of the enum
    expect(() => env()).toThrowError(/APP_ENV/);
  });

  it("rejects a malformed APP_URL", () => {
    process.env.APP_URL = "not a url";
    expect(() => env()).toThrowError(/APP_URL/);
  });

  it("caches after first successful parse until reset", () => {
    delete process.env.APP_ENV;
    expect(env().APP_ENV).toBe("development");
    process.env.APP_ENV = "production";
    expect(env().APP_ENV).toBe("development"); // still cached
    resetEnvCache();
    expect(env().APP_ENV).toBe("production");
  });
});
