import { protectedProcedure, router } from "../trpc";

export const sessionRouter = router({
   getSession: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      return resolvedCtx.session;
   }),
});
