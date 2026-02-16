import { ORPCError } from "@orpc/server";
import { isOrganizationOwner } from "@packages/database/repositories/auth-repository";
import { customRoles, memberRoles } from "@packages/database/schemas/roles";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

const createRoleSchema = z.object({
   name: z.string().min(1).max(50),
   description: z.string().max(200).optional(),
   permissions: z.array(z.string()),
});

const updateRoleSchema = z.object({
   roleId: z.string().uuid(),
   name: z.string().min(1).max(50).optional(),
   description: z.string().max(200).optional(),
   permissions: z.array(z.string()).optional(),
});

const assignRoleSchema = z.object({
   memberId: z.string().uuid(),
   roleId: z.string().uuid(),
});

/**
 * Get all custom roles for organization
 */
export const getAll = protectedProcedure.handler(async ({ context }) => {
   const { db, organizationId } = context;

   const roles = await db.query.customRoles.findMany({
      where: eq(customRoles.organizationId, organizationId),
      with: {
         memberRoles: {
            with: {
               member: {
                  with: {
                     user: {
                        columns: {
                           id: true,
                           name: true,
                           email: true,
                        },
                     },
                  },
               },
            },
         },
      },
   });

   return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isDefault: role.isDefault,
      memberCount: role.memberRoles.length,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
   }));
});

/**
 * Create a custom role
 */
export const create = protectedProcedure
   .input(createRoleSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId, userId } = context;

      // Only owners can create roles
      const isOwner = await isOrganizationOwner(db, userId, organizationId);
      if (!isOwner) {
         throw new ORPCError("FORBIDDEN", {
            message: "Only organization owners can create roles",
         });
      }

      const [role] = await db
         .insert(customRoles)
         .values({
            organizationId,
            name: input.name,
            description: input.description,
            permissions: input.permissions,
         })
         .returning();

      return role;
   });

/**
 * Update a custom role
 */
export const update = protectedProcedure
   .input(updateRoleSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId, userId } = context;

      // Only owners can update roles
      const isOwner = await isOrganizationOwner(db, userId, organizationId);
      if (!isOwner) {
         throw new ORPCError("FORBIDDEN", {
            message: "Only organization owners can update roles",
         });
      }

      // Verify role belongs to organization
      const existing = await db.query.customRoles.findFirst({
         where: and(
            eq(customRoles.id, input.roleId),
            eq(customRoles.organizationId, organizationId),
         ),
      });

      if (!existing) {
         throw new ORPCError("NOT_FOUND", {
            message: "Role not found",
         });
      }

      if (existing.isDefault) {
         throw new ORPCError("BAD_REQUEST", {
            message: "Cannot modify default roles",
         });
      }

      const updateData: Record<string, unknown> = {};
      if (input.name) updateData.name = input.name;
      if (input.description !== undefined)
         updateData.description = input.description;
      if (input.permissions) updateData.permissions = input.permissions;

      const [updated] = await db
         .update(customRoles)
         .set(updateData)
         .where(eq(customRoles.id, input.roleId))
         .returning();

      return updated;
   });

/**
 * Delete a custom role
 */
export const deleteRole = protectedProcedure
   .input(z.object({ roleId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId, userId } = context;

      // Only owners can delete roles
      const isOwner = await isOrganizationOwner(db, userId, organizationId);
      if (!isOwner) {
         throw new ORPCError("FORBIDDEN", {
            message: "Only organization owners can delete roles",
         });
      }

      // Verify role belongs to organization
      const existing = await db.query.customRoles.findFirst({
         where: and(
            eq(customRoles.id, input.roleId),
            eq(customRoles.organizationId, organizationId),
         ),
      });

      if (!existing) {
         throw new ORPCError("NOT_FOUND", {
            message: "Role not found",
         });
      }

      if (existing.isDefault) {
         throw new ORPCError("BAD_REQUEST", {
            message: "Cannot delete default roles",
         });
      }

      await db.delete(customRoles).where(eq(customRoles.id, input.roleId));

      return { success: true };
   });

/**
 * Assign role to member
 */
export const assignRole = protectedProcedure
   .input(assignRoleSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      // Verify role belongs to organization
      const role = await db.query.customRoles.findFirst({
         where: and(
            eq(customRoles.id, input.roleId),
            eq(customRoles.organizationId, organizationId),
         ),
      });

      if (!role) {
         throw new ORPCError("NOT_FOUND", {
            message: "Role not found",
         });
      }

      // Check if already assigned
      const existing = await db.query.memberRoles.findFirst({
         where: and(
            eq(memberRoles.memberId, input.memberId),
            eq(memberRoles.roleId, input.roleId),
         ),
      });

      if (existing) {
         throw new ORPCError("BAD_REQUEST", {
            message: "Role already assigned to member",
         });
      }

      const [assignment] = await db
         .insert(memberRoles)
         .values({
            memberId: input.memberId,
            roleId: input.roleId,
         })
         .returning();

      return assignment;
   });

/**
 * Remove role from member
 */
export const removeRole = protectedProcedure
   .input(assignRoleSchema)
   .handler(async ({ context, input }) => {
      const { db } = context;

      await db
         .delete(memberRoles)
         .where(
            and(
               eq(memberRoles.memberId, input.memberId),
               eq(memberRoles.roleId, input.roleId),
            ),
         );

      return { success: true };
   });
