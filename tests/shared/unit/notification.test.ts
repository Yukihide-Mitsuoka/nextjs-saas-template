import { afterEach, describe, expect, it, vi } from "vitest";
import { resetEnvCache } from "@/shared/lib/env";
import { logNotifier, notifier, slackNotifier } from "@/shared/lib/notification";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
  resetEnvCache();
  vi.unstubAllGlobals();
});

describe("notifier selection", () => {
  it("falls back to the log adapter when SLACK_WEBHOOK_URL is unset", () => {
    delete process.env.SLACK_WEBHOOK_URL;
    expect(notifier()).toBe(logNotifier);
  });

  it("selects slack when configured", () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T/B/X";
    expect(notifier()).toBe(slackNotifier);
  });
});

describe("slackNotifier", () => {
  it("posts severity-prefixed text to the webhook", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T/B/X";
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await slackNotifier.notify({ title: "Payment failed", body: "org acme", severity: "warning" });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("hooks.slack.com");
    expect(String(init.body)).toContain("⚠️");
    expect(String(init.body)).toContain("Payment failed");
  });

  it("never throws when the webhook is down (logged instead)", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T/B/X";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    await expect(
      slackNotifier.notify({ title: "t", body: "b", severity: "critical" }),
    ).resolves.toBeUndefined();
  });
});
