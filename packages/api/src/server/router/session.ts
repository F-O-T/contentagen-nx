import { publicProcedure, router } from "../trpc";

export const sessionRouter = router({
   getSession: publicProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      return resolvedCtx.session;
   }),
});
