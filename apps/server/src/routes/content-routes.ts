import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { contentRequest } from "../schemas/content-schema";
import { createInsertSchema } from "drizzle-typebox";
import { authMiddleware } from "../integrations/auth";
import { contentGenerationQueue } from "@api/workers/content-generation";

const _createContentRequest = createInsertSchema(contentRequest);

export const contentRoutes = new Elysia({
   prefix: "/content/request",
})
   .use(authMiddleware)
   .post(
      "/generate",
      async ({ body, set, user }) => {
         const { id: userId } = user;

         const [request] = await db
            .insert(contentRequest)
            .values({
               ...body,
               userId,
            })
            .returning();

         await contentGenerationQueue.add("generateContent", {
            requestId: request?.id,
         });

         set.status = 202;
         return {
            request,
         };
      },
      {
         auth: true,
         body: t.Omit(_createContentRequest, [
            "id",
            "updatedAt",
            "createdAt",
            "isCompleted",
            "generatedContentId",
            "userId",
         ]),
      },
   );
