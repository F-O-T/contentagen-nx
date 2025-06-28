import { db } from "@api/integrations/database";
import { waitlist } from "@api/schemas/waitlist-schema";
import { createInsertSchema } from "drizzle-typebox";
import { Elysia, t } from "elysia";

const _createWaitlist = createInsertSchema(waitlist);

export const waitlistRoutes = new Elysia({
   prefix: "/waitlist",
}).post(
   "/",
   async ({ body }) => {
      const leadCreated = await db
         .insert(waitlist)
         .values({
            email: body.email,
            leadType: body.leadType,
         })
         .returning();
      return { leadCreated };
   },
   {
      body: t.Omit(_createWaitlist, ["id", "createdAt"]),
   },
);
