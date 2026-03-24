import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getAllStaff,
  getAllStaffStatus,
  upsertStaffStatus,
  getAllVenues,
  getAllAreas,
} from "../db";
import { validatePinSession } from "./auth";

// ─── スタッフ router ──────────────────────────────────────────────────────────
export const staffRouter = router({
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
        status: z.enum(["active", "moving", "break_1f", "break_3f", "break_room"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!(await validatePinSession(ctx.req))) throw new TRPCError({ code: "UNAUTHORIZED" });
      await upsertStaffStatus(input);
      return { success: true };
    }),
});

// ─── 会場 router ──────────────────────────────────────────────────────────────
export const venueRouter = router({
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
