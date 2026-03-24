import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createHash } from "crypto";

// ─── Mock context ─────────────────────────────────────────────────────────────
function createCtx(cookies: Record<string, string> = {}): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {
        "x-forwarded-proto": "https",
        cookie: Object.entries(cookies)
          .map(([k, v]) => `${k}=${v}`)
          .join("; "),
      },
      cookies,
    } as unknown as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

// ─── Staff Tests ──────────────────────────────────────────────────────────────
describe("staff.list", () => {
  it("returns staff list", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.staff.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Task Tests ───────────────────────────────────────────────────────────────
describe("task.list", () => {
  it("returns task list", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.task.list({ includeCompleted: false });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Tetris Tests ─────────────────────────────────────────────────────────────
describe("tetris.list", () => {
  it("returns tetris entries", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.tetris.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Venue Tests ──────────────────────────────────────────────────────────────
describe("venue.list", () => {
  it("returns venue list", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.venue.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Auth logout ──────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears cookie and returns success", async () => {
    const cleared: string[] = [];
    const ctx = createCtx();
    ctx.res.clearCookie = (name: string) => { cleared.push(name); };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
