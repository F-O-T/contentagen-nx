import { protectedProcedure, publicProcedure, router } from "../trpc";

export const sessionRouter = router({
   getDefaultOrganization: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organization = await resolvedCtx.auth.api.getFullOrganization({
         headers: resolvedCtx.headers,
      });
      return organization;
   }),
   getCustomerState: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const customer = resolvedCtx.auth.api.state({
         headers: resolvedCtx.headers,
      });
      return customer;
   }),
   getSession: publicProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      return resolvedCtx.session;
   }),
});
