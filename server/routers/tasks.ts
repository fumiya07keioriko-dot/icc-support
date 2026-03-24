import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { syncTetrisFromSheets, getLastSyncResult } from "../sheetsSync";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTetrisEntries,
} from "../db";
import { validatePinSession } from "./auth";

// ─── タスク router ────────────────────────────────────────────────────────────
export const taskRouter = router({
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
        reminderAt: z.date().optional(),
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
        reminderAt: input.reminderAt ?? null,
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
        reminderAt: z.date().nullable().optional(),
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
export const tetrisRouter = router({
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
