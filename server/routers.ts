import { router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { authRouter, pinRouter, adminRouter } from "./routers/auth";
import { taskRouter, tetrisRouter } from "./routers/tasks";
import { venueRouter, staffRouter } from "./routers/venue";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  pin: pinRouter,
  staff: staffRouter,
  venue: venueRouter,
  task: taskRouter,
  tetris: tetrisRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
