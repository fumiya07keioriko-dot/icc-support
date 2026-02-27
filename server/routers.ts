import { createHash, randomBytes } from "crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { syncTetrisFromSheets, getLastSyncResult } from "./sheetsSync";
import {
  getConfig,
  setConfig,
  createPinSession,
  getPinSession,
  touchPinSession,
  deletePinSession,
  deleteAllPinSessions,
  getAllStaff,
  getAllStaffStatus,
  upsertStaffStatus,
  getAllVenues,
  getAllAreas,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTetrisEntries,
} from "./db";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PIN_COOKIE = "icc_pin_session";
const PIN_TRUSTED_DAYS = 30;
const PIN_NORMAL_HOURS = 24;

function hashPin(pin: string): string {
  return createHash("sha256").update(`icc-pin:${pin}`).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

async function getCurrentGeneration(): Promise<number> {
  const gen = await getConfig("pin_generation");
  return gen ? parseInt(gen, 10) : 1;
}

/** リクエストのCookieからPINセッションを取得し検証する */
async function validatePinSession(req: any): Promise<boolean> {
  const raw = req.cookies?.[PIN_COOKIE] ?? req.headers?.cookie
    ?.split(";")
    .find((c: string) => c.trim().startsWith(`${PIN_COOKIE}=`))
    ?.split("=")[1]
    ?.trim();
  if (!raw) return false;
  const session = await getPinSession(raw);
  if (!session) return false;
  if (new Date() > session.expiresAt) {
    await deletePinSession(raw);
    return false;
  }
  const currentGen = await getCurrentGeneration();
  if (session.generation < currentGen) {
    await deletePinSession(raw);
    return false;
  }
  await touchPinSession(raw);
  return true;
}

async function getSessionToken(req: any): Promise<string | null> {
  const raw = req.cookies?.[PIN_COOKIE] ?? req.headers?.cookie
    ?.split(";")
    .find((c: string) => c.trim().startsWith(`${PIN_COOKIE}=`))
    ?.split("=")[1]
    ?.trim();
  return raw ?? null;
}

// ─── PIN 認証 router ──────────────────────────────────────────────────────────
const pinRouter = router({
  /** セッション確認 */
  check: publicProcedure.query(async ({ ctx }) => {
    const valid = await validatePinSession(ctx.req);
    return { authenticated: valid };
  }),

  /** PINログイン */
  login: publicProcedure
    .input(z.object({ pin: z.string().min(4).max(6), trusted: z.boolean().default(false) }))
    .mutation(async ({ input, ctx }) => {
      const storedHash = await getConfig("pin_hash");
      if (!storedHash) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "PIN未設定" });

      if (hashPin(input.pin) !== storedHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "PINが正しくありません" });
      }

      const generation = await getCurrentGeneration();
      const token = generateToken();
      const expiresAt = new Date();
      if (input.trusted) {
        expiresAt.setDate(expiresAt.getDate() + PIN_TRUSTED_DAYS);
      } else {
        expiresAt.setHours(expiresAt.getHours() + PIN_NORMAL_HOURS);
      }

      await createPinSession({ token, trusted: input.trusted, generation, expiresAt });

      const isSecure = ctx.req.protocol === "https" || ctx.req.headers["x-forwarded-proto"] === "https";
      ctx.res.cookie(PIN_COOKIE, token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: isSecure ? "none" : "lax",
        expires: expiresAt,
        path: "/",
      });

      return { success: true };
    }),

  /** ログアウト */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const token = await getSessionToken(ctx.req);
    if (token) await deletePinSession(token);
    ctx.res.clearCookie(PIN_COOKIE, { path: "/" });
    return { success: true };
  }),
});

// ─── スタッフ router ──────────────────────────────────────────────────────────
const staffRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    if (!(await validatePinSession(ctx.req))) throw new TRPCError({ code: "UNAUTHORIZED" });
    const staffList = await getAllStaff();
    const statusList = await getAllStaffStatus();
    const venues = await getAllVenues();
    const areas = await getAllAreas();
    return staffList.map((s) => {
      const status = statusList.find((st) => st.staffId === s.staffId);
      const venue = status?.venueId ? venues.find((v) => v.id === status.venueId) : null;
      const area = status?.areaId ? areas.find((a) => a.id === status.areaId) : null;
      return {
        ...s,
        status: status?.status ?? "active",
        venueId: status?.venueId ?? null,
        venueName: venue?.name ?? null,
        areaId: status?.areaId ?? null,
        areaName: area?.name ?? null,
        workContent: status?.workContent ?? "",
        updatedAt: status?.updatedAt ?? null,
      };
    });
  }),

  updateStatus: publicProcedure
    .input(
      z.object({
        staffId: z.string(),
        venueId: z.number().nullable(),
        areaId: z.number().nullable(),
        workContent: z.string().max(255),
        status: z.enum(["active", "moving", "break", "available"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!(await validatePinSession(ctx.req))) throw new TRPCError({ code: "UNAUTHORIZED" });
      await upsertStaffStatus(input);
      return { success: true };
    }),
});

// ─── 会場 router ──────────────────────────────────────────────────────────────
const venueRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    if (!(await validatePinSession(ctx.req))) throw new TRPCError({ code: "UNAUTHORIZED" });
    const venueList = await getAllVenues();
    const areaList = await getAllAreas();
    return venueList.map((v) => ({
      ...v,
      areas: areaList.filter((a) => a.venueId === v.id),
    }));
  }),
});

// ─── タスク router ────────────────────────────────────────────────────────────
const taskRouter = router({
  list: publicProcedure
    .input(z.object({ includeCompleted: z.boolean().default(false) }))
    .query(async ({ input, ctx }) => {
      if (!(await validatePinSession(ctx.req))) throw new TRPCError({ code: "UNAUTHORIZED" });
      return getTasks(input.includeCompleted);
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        priority: z.enum(["high", "medium", "low"]).default("medium"),
        assigneeId: z.string().optional(),
        venueId: z.number().optional(),
        areaId: z.number().optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!(await validatePinSession(ctx.req))) throw new TRPCError({ code: "UNAUTHORIZED" });
      const id = await createTask({
        title: input.title,
        description: input.description ?? null,
        priority: input.priority,
        state: "todo",
        assigneeId: input.assigneeId ?? null,
        venueId: input.venueId ?? null,
        areaId: input.areaId ?? null,
        dueDate: input.dueDate ?? null,
      });
      return { id };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        priority: z.enum(["high", "medium", "low"]).optional(),
        state: z.enum(["todo", "in_progress", "done"]).optional(),
        assigneeId: z.string().nullable().optional(),
        venueId: z.number().nullable().optional(),
        areaId: z.number().nullable().optional(),
        dueDate: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!(await validatePinSession(ctx.req))) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { id, ...data } = input;
      await updateTask(id, data as any);
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!(await validatePinSession(ctx.req))) throw new TRPCError({ code: "UNAUTHORIZED" });
      await deleteTask(input.id);
      return { success: true };
    }),
});

// ─── テトリス router ──────────────────────────────────────────────────────────
const tetrisRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    if (!(await validatePinSession(ctx.req))) throw new TRPCError({ code: "UNAUTHORIZED" });
    return getTetrisEntries();
  }),
  syncStatus: publicProcedure.query(async ({ ctx }) => {
    if (!(await validatePinSession(ctx.req))) throw new TRPCError({ code: "UNAUTHORIZED" });
    return getLastSyncResult();
  }),
  manualSync: publicProcedure.mutation(async ({ ctx }) => {
    if (!(await validatePinSession(ctx.req))) throw new TRPCError({ code: "UNAUTHORIZED" });
    const result = await syncTetrisFromSheets();
    return result;
  }),
});

// ─── 管理者 router ────────────────────────────────────────────────────────────
const adminRouter = router({
  /** PIN変更（管理者のみ） */
  changePin: publicProcedure
    .input(
      z.object({
        adminPin: z.string(),
        newPin: z.string().min(4).max(6),
        revokeAll: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!(await validatePinSession(ctx.req))) throw new TRPCError({ code: "UNAUTHORIZED" });
      // 現在のPINで管理者確認
      const storedHash = await getConfig("pin_hash");
      if (!storedHash || hashPin(input.adminPin) !== storedHash) {
        throw new TRPCError({ code: "FORBIDDEN", message: "現在のPINが正しくありません" });
      }
      // 新PINを保存
      await setConfig("pin_hash", hashPin(input.newPin));
      // セッション世代をインクリメント
      const currentGen = await getCurrentGeneration();
      await setConfig("pin_generation", String(currentGen + 1));
      // 全セッション失効
      if (input.revokeAll) {
        await deleteAllPinSessions();
      }
      return { success: true };
    }),

  /** スタッフ一覧（管理者用） */
  staffList: publicProcedure.query(async ({ ctx }) => {
    if (!(await validatePinSession(ctx.req))) throw new TRPCError({ code: "UNAUTHORIZED" });
    return getAllStaff();
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  pin: pinRouter,
  staff: staffRouter,
  venue: venueRouter,
  task: taskRouter,
  tetris: tetrisRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
