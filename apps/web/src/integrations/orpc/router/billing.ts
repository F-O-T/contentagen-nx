import { ORPCError } from "@orpc/server";
import {
   currentMonthStorageCost,
   currentMonthUsageByCategory,
   currentMonthUsageByEvent,
   dailyUsageByEvent,
   eventCatalog,
} from "@packages/database/schema";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../server";

/**
 * Get user invoices from Stripe
 */
export const getInvoices = protectedProcedure
   .input(
      z
         .object({
            limit: z.number().min(1).max(100).optional().default(10),
         })
         .optional(),
   )
   .handler(async ({ context, input }) => {
      const { db, stripeClient, userId } = context;

      if (!stripeClient) {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Stripe client not configured",
         });
      }

      // Get the user's stripe customer ID from the user table
      const userRecord = await db.query.user.findFirst({
         where: (users, { eq }) => eq(users.id, userId),
      });

      if (!userRecord?.stripeCustomerId) {
         // Return empty array if user has no Stripe customer
         return [];
      }

      try {
         const invoices = await stripeClient.invoices.list({
            customer: userRecord.stripeCustomerId,
            limit: input?.limit ?? 10,
         });

         return invoices.data.map((invoice) => ({
            id: invoice.id,
            number: invoice.number,
            amountPaid: invoice.amount_paid,
            amountDue: invoice.amount_due,
            currency: invoice.currency,
            status: invoice.status,
            created: invoice.created,
            periodStart: invoice.period_start,
            periodEnd: invoice.period_end,
            invoicePdf: invoice.invoice_pdf ?? null,
            hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
         }));
      } catch (_error) {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to fetch invoices",
         });
      }
   });

/**
 * Get upcoming invoice preview from Stripe
 */
export const getUpcomingInvoice = protectedProcedure.handler(
   async ({ context }) => {
      const { db, stripeClient, userId } = context;

      if (!stripeClient) {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Stripe client not configured",
         });
      }

      const userRecord = await db.query.user.findFirst({
         where: (users, { eq }) => eq(users.id, userId),
      });

      if (!userRecord?.stripeCustomerId) {
         return null;
      }

      try {
         const upcoming = await stripeClient.invoices.createPreview({
            customer: userRecord.stripeCustomerId,
         });

         return {
            amountDue: upcoming.amount_due,
            currency: upcoming.currency,
            periodStart: upcoming.period_start,
            periodEnd: upcoming.period_end,
            nextPaymentAttempt: upcoming.next_payment_attempt,
            lines: upcoming.lines.data.map((line) => ({
               description: line.description,
               amount: line.amount,
               quantity: line.quantity,
            })),
         };
      } catch (_error) {
         // If no upcoming invoice exists (e.g., canceled subscription), return null
         return null;
      }
   },
);

/**
 * Get current month usage summary by category
 */
export const getCurrentUsage = protectedProcedure.handler(
   async ({ context }) => {
      const { db, organizationId } = context;

      try {
         const [rows, storageRows] = await Promise.all([
            db
               .select()
               .from(currentMonthUsageByCategory)
               .where(
                  eq(
                     currentMonthUsageByCategory.organizationId,
                     organizationId,
                  ),
               ),
            db
               .select()
               .from(currentMonthStorageCost)
               .where(
                  eq(currentMonthStorageCost.organizationId, organizationId),
               ),
         ]);

         const byCategory = rows.map((row) => ({
            category: row.eventCategory,
            eventCount: row.eventCount,
            monthToDateCost: Number(row.monthToDateCost),
            projectedCost: Number(row.projectedCost),
         }));

         const storageRow = storageRows[0];
         const storageMonthToDate = Number(storageRow?.monthToDateCost ?? 0);
         const storageProjected = Number(storageRow?.projectedCost ?? 0);

         const monthToDate =
            byCategory.reduce((sum, c) => sum + c.monthToDateCost, 0) +
            storageMonthToDate;
         const projected =
            byCategory.reduce((sum, c) => sum + c.projectedCost, 0) +
            storageProjected;

         return { monthToDate, projected, byCategory };
      } catch (_error) {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to fetch current usage",
         });
      }
   },
);

/**
 * Get current month storage usage and cost for the organization
 */
export const getStorageUsage = protectedProcedure.handler(
   async ({ context }) => {
      const { db, organizationId } = context;

      try {
         const rows = await db
            .select()
            .from(currentMonthStorageCost)
            .where(eq(currentMonthStorageCost.organizationId, organizationId));

         const row = rows[0];
         return {
            currentBytes: Number(row?.currentBytes ?? 0),
            monthToDateCost: Number(row?.monthToDateCost ?? 0),
            projectedCost: Number(row?.projectedCost ?? 0),
         };
      } catch (_error) {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to fetch storage usage",
         });
      }
   },
);

/**
 * Get usage by event for a specific category, enriched with catalog metadata
 */
export const getCategoryUsage = protectedProcedure
   .input(
      z.object({
         category: z.enum([
            "content",
            "ai",
            "form",
            "seo",
            "experiment",
            "webhook",
            "cluster",
            "system",
         ]),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      try {
         const [usageRows, catalogRows] = await Promise.all([
            db
               .select()
               .from(currentMonthUsageByEvent)
               .where(
                  and(
                     eq(
                        currentMonthUsageByEvent.organizationId,
                        organizationId,
                     ),
                     eq(currentMonthUsageByEvent.eventCategory, input.category),
                  ),
               ),
            db
               .select()
               .from(eventCatalog)
               .where(eq(eventCatalog.category, input.category)),
         ]);

         const catalogByName = new Map(
            catalogRows.map((c) => [c.eventName, c]),
         );

         return usageRows.map((row) => {
            const catalog = catalogByName.get(row.eventName);
            return {
               eventName: row.eventName,
               eventCount: row.eventCount,
               monthToDateCost: Number(row.monthToDateCost),
               displayName: catalog?.displayName ?? row.eventName,
               description: catalog?.description ?? null,
               pricePerEvent: catalog ? Number(catalog.pricePerEvent) : null,
               freeTierLimit: catalog?.freeTierLimit ?? 0,
            };
         });
      } catch (_error) {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to fetch category usage",
         });
      }
   });

/**
 * Get daily usage chart data for the last N days
 */
export const getDailyUsage = protectedProcedure
   .input(z.object({ days: z.number().int().min(1).max(90).default(30) }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      try {
         const rows = await db
            .select()
            .from(dailyUsageByEvent)
            .where(
               and(
                  eq(dailyUsageByEvent.organizationId, organizationId),
                  sql`${dailyUsageByEvent.date} >= CURRENT_DATE - ${input.days} * INTERVAL '1 day'`,
               ),
            );

         // Group by date, aggregate by category (both cost and event count)
         const dateMap = new Map<
            string,
            {
               total: number;
               totalCount: number;
               byCategory: Map<string, number>;
               countByCategory: Map<string, number>;
            }
         >();

         for (const row of rows) {
            const dateStr = row.date;
            if (!dateMap.has(dateStr)) {
               dateMap.set(dateStr, {
                  total: 0,
                  totalCount: 0,
                  byCategory: new Map(),
                  countByCategory: new Map(),
               });
            }
            const entry = dateMap.get(dateStr);
            if (!entry) continue;
            const cost = Number(row.totalCost);
            const count = row.eventCount;
            entry.total += cost;
            entry.totalCount += count;
            entry.byCategory.set(
               row.eventCategory,
               (entry.byCategory.get(row.eventCategory) ?? 0) + cost,
            );
            entry.countByCategory.set(
               row.eventCategory,
               (entry.countByCategory.get(row.eventCategory) ?? 0) + count,
            );
         }

         return Array.from(dateMap.entries())
            .map(([date, data]) => ({
               date,
               total: data.total,
               totalCount: data.totalCount,
               byCategory: Object.fromEntries(data.byCategory),
               countByCategory: Object.fromEntries(data.countByCategory),
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
      } catch (_error) {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to fetch daily usage",
         });
      }
   });
