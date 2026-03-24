import { router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { authRouter } from "./routers/auth";
import { taskRouter, tetrisRouter } from "./routers/tasks";
import { venueRouter, staffRouter } from "./routers/venue";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  staff: staffRouter,
  venue: venueRouter,
  task: taskRouter,
  tetris: tetrisRouter,
});

export type AppRouter = typeof appRouter;
