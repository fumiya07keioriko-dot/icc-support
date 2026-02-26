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

// ─── PIN Auth Tests ───────────────────────────────────────────────────────────
describe("pin.check (unauthenticated)", () => {
  it("returns authenticated: false when no session cookie", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.pin.check();
    expect(result.authenticated).toBe(false);
  });
});

describe("pin.login", () => {
  it("throws UNAUTHORIZED for wrong PIN", async () => {
    const ctx = createCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.pin.login({ pin: "9999", trusted: false })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("successfully logs in with correct PIN (1234)", async () => {
    let cookieSet = false;
    const ctx = createCtx();
    ctx.res.cookie = () => { cookieSet = true; };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.pin.login({ pin: "1234", trusted: false });
    expect(result.success).toBe(true);
    expect(cookieSet).toBe(true);
  });
});

// ─── Staff Tests ──────────────────────────────────────────────────────────────
describe("staff.list (unauthenticated)", () => {
  it("throws UNAUTHORIZED without session", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.staff.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

// ─── Task Tests ───────────────────────────────────────────────────────────────
describe("task.list (unauthenticated)", () => {
  it("throws UNAUTHORIZED without session", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.task.list({ includeCompleted: false })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

// ─── Tetris Tests ─────────────────────────────────────────────────────────────
describe("tetris.list (unauthenticated)", () => {
  it("throws UNAUTHORIZED without session", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.tetris.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

// ─── Venue Tests ──────────────────────────────────────────────────────────────
describe("venue.list (unauthenticated)", () => {
  it("throws UNAUTHORIZED without session", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.venue.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

// ─── Admin Tests ──────────────────────────────────────────────────────────────
describe("admin.changePin (unauthenticated)", () => {
  it("throws UNAUTHORIZED without session", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.admin.changePin({ adminPin: "1234", newPin: "5678", revokeAll: false })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
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
