import { describe, expect, it } from "vitest";
import { slidingWindowLimit, type RateLimitStore } from "@/shared/lib/rate-limit";

function memoryStore(): RateLimitStore & { events: Array<{ key: string; at: Date }> } {
  const events: Array<{ key: string; at: Date }> = [];
  return {
    events,
    async record(key, at) {
      events.push({ key, at });
    },
    async countSince(key, since) {
      return events.filter((e) => e.key === key && e.at >= since).length;
    },
    async prune(key, before) {
      for (let i = events.length - 1; i >= 0; i--) {
        const e = events[i];
        if (e !== undefined && e.key === key && e.at < before) events.splice(i, 1);
      }
    },
  };
}

const at = (s: number) => new Date(2026, 0, 1, 0, 0, s);

describe("slidingWindowLimit", () => {
  it("allows up to the limit inside the window, then denies", async () => {
    const store = memoryStore();
    for (let i = 0; i < 3; i++) {
      expect((await slidingWindowLimit(store, "k", 3, 60_000, at(i))).allowed).toBe(true);
    }
    expect((await slidingWindowLimit(store, "k", 3, 60_000, at(3))).allowed).toBe(false);
  });

  it("frees capacity as old events slide out of the window", async () => {
    const store = memoryStore();
    await slidingWindowLimit(store, "k", 1, 10_000, at(0));
    expect((await slidingWindowLimit(store, "k", 1, 10_000, at(5))).allowed).toBe(false);
    expect((await slidingWindowLimit(store, "k", 1, 10_000, at(20))).allowed).toBe(true);
  });

  it("isolates keys and prunes expired rows on denial", async () => {
    const store = memoryStore();
    await slidingWindowLimit(store, "a", 1, 10_000, at(0));
    expect((await slidingWindowLimit(store, "b", 1, 10_000, at(1))).allowed).toBe(true);
    await slidingWindowLimit(store, "a", 1, 10_000, at(30));
    await slidingWindowLimit(store, "a", 1, 10_000, at(31)); // denial triggers prune
    expect(store.events.filter((e) => e.key === "a" && e.at < at(21)).length).toBe(0);
  });
});
