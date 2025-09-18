import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const UpdateOrganizationInput = z.object({
   id: z.string(),
   name: z.string().optional(),
   websiteUrl: z.string().url().nullable().optional(),
   description: z.string().max(500).nullable().optional(),
   summary: z.string().max(1000).nullable().optional(),
   logo: z.string().url().nullable().optional(),
});

export const organizationRouter = router({
   update: protectedProcedure
      .input(UpdateOrganizationInput)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;
         
         if (!userId) {
            throw new Error("User not authenticated");
         }

         // Check if user has permission to update this organization
         const organization = await resolvedCtx.db.query.organization.findFirst({
            where: (org, { eq }) => eq(org.id, input.id),
            with: {
               members: {
                  where: (member, { eq }) => eq(member.userId, userId),
               },
            },
         });

         if (!organization) {
            throw new Error("Organization not found");
         }

         if (organization.members.length === 0) {
            throw new Error("You don't have permission to update this organization");
         }

         // Update organization
         const updatedOrganization = await resolvedCtx.db
            .update(resolvedCtx.db.schema.organization)
            .set({
               ...(input.name && { name: input.name }),
               ...(input.websiteUrl !== undefined && { websiteUrl: input.websiteUrl }),
               ...(input.description !== undefined && { description: input.description }),
               ...(input.summary !== undefined && { summary: input.summary }),
               ...(input.logo !== undefined && { logo: input.logo }),
            })
            .where(resolvedCtx.db.schema.organization.id.equals(input.id))
            .returning();

         return updatedOrganization[0];
      }),
});