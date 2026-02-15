import { activityLogs } from "@packages/database/schemas/activity-logs";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

const getLogsSchema = z.object({
   teamId: z.string().uuid(),
   limit: z.number().min(1).max(100).default(50),
   offset: z.number().min(0).default(0),
   action: z.string().optional(),
   resourceType: z.string().optional(),
   userId: z.string().uuid().optional(),
   dateFrom: z.string().datetime().optional(),
   dateTo: z.string().datetime().optional(),
});

/**
 * Get activity logs for a team with filters
 */
export const getAll = protectedProcedure
   .input(getLogsSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const conditions = [
         eq(activityLogs.organizationId, organizationId),
         eq(activityLogs.teamId, input.teamId),
      ];

      if (input.action) {
         conditions.push(eq(activityLogs.action, input.action));
      }

      if (input.resourceType) {
         conditions.push(eq(activityLogs.resourceType, input.resourceType));
      }

      if (input.userId) {
         conditions.push(eq(activityLogs.userId, input.userId));
      }

      if (input.dateFrom) {
         conditions.push(gte(activityLogs.createdAt, new Date(input.dateFrom)));
      }

      if (input.dateTo) {
         conditions.push(lte(activityLogs.createdAt, new Date(input.dateTo)));
      }

      const [logs, countResult] = await Promise.all([
         db.query.activityLogs.findMany({
            where: and(...conditions),
            with: {
               user: {
                  columns: {
                     id: true,
                     name: true,
                     email: true,
                     image: true,
                  },
               },
            },
            orderBy: [desc(activityLogs.createdAt)],
            limit: input.limit,
            offset: input.offset,
         }),
         db
            .select({ count: sql<number>`count(*)` })
            .from(activityLogs)
            .where(and(...conditions)),
      ]);

      const total = Number(countResult[0]?.count ?? 0);

      return {
         logs: logs.map((log) => ({
            id: log.id,
            action: log.action,
            resourceType: log.resourceType,
            resourceId: log.resourceId,
            resourceName: log.resourceName,
            metadata: log.metadata,
            ipAddress: log.ipAddress,
            createdAt: log.createdAt,
            user: log.user
               ? {
                    id: log.user.id,
                    name: log.user.name,
                    email: log.user.email,
                    image: log.user.image,
                 }
               : null,
         })),
         total,
         hasMore: input.offset + input.limit < total,
      };
   });

/**
 * Get available filter options (actions, resource types)
 */
export const getFilters = protectedProcedure
   .input(z.object({ teamId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const [actions, resourceTypes] = await Promise.all([
         db
            .selectDistinct({ action: activityLogs.action })
            .from(activityLogs)
            .where(
               and(
                  eq(activityLogs.organizationId, organizationId),
                  eq(activityLogs.teamId, input.teamId),
               ),
            ),
         db
            .selectDistinct({ resourceType: activityLogs.resourceType })
            .from(activityLogs)
            .where(
               and(
                  eq(activityLogs.organizationId, organizationId),
                  eq(activityLogs.teamId, input.teamId),
               ),
            ),
      ]);

      return {
         actions: actions.map((a) => a.action).filter(Boolean),
         resourceTypes: resourceTypes
            .map((r) => r.resourceType)
            .filter(Boolean),
      };
   });
