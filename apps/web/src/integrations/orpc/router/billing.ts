import { ORPCError } from "@orpc/server";
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
      } catch (error) {
         console.error("Failed to fetch invoices:", error);
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
      } catch (error) {
         // If no upcoming invoice exists (e.g., canceled subscription), return null
         console.error("Failed to fetch upcoming invoice:", error);
         return null;
      }
   },
);
