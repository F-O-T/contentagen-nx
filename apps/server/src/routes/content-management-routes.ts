import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { contentRequest } from "../schemas/content-schema";
import { createSelectSchema } from "drizzle-typebox";
import { authMiddleware } from "../integrations/auth";
import { contentGenerationQueue } from "@api/workers/content-generation-worker";
import { eq } from "drizzle-orm";

// OpenAPI Tags for route organization
enum ApiTags {
   CONTENT_MANAGEMENT = "Content Management",
}

const _selectContentRequest = createSelectSchema(contentRequest);

// Specific schemas for different endpoints
const _contentRequestParams = t.Object({
   id: t.String({ format: "uuid" }),
});

const _approveRejectResponse = t.Object({
   request: _selectContentRequest,
});

const _errorResponse = t.Object({
   message: t.String(),
});

export const contentManagementRoutes = new Elysia({
   prefix: "/management",
   tags: [ApiTags.CONTENT_MANAGEMENT],
})
   .use(authMiddleware)
   .post(
      "/approve/:id",
      async ({ params, set }) => {
         const { id } = params;

         const [request] = await db
            .update(contentRequest)
            .set({ approved: true })
            .where(eq(contentRequest.id, id))
            .returning();

         if (!request) {
            set.status = 404;
            return { message: "Content request not found" };
         }

         await contentGenerationQueue.add("generateContent", {
            requestId: request.id,
         });

         set.status = 202;
         return {
            request,
         };
      },
      {
         auth: true,
         detail: {
            summary: "Approve a content request",
            description:
               "Approve a pending content request and queue it for content generation. This will change the request status to 'approved' and trigger the content generation worker.",
            tags: [ApiTags.CONTENT_MANAGEMENT],
            responses: {
               202: {
                  description:
                     "Content request approved and queued for generation",
               },
               404: {
                  description: "Content request not found",
               },
            },
         },
         params: _contentRequestParams,
         response: {
            202: _approveRejectResponse,
            404: _errorResponse,
         },
      },
   )
   .post(
      "/reject/:id",
      async ({ params, set }) => {
         const { id } = params;

         const [request] = await db
            .update(contentRequest)
            .set({ approved: false })
            .where(eq(contentRequest.id, id))
            .returning();

         if (!request) {
            set.status = 404;
            return { message: "Content request not found" };
         }

         return {
            request,
         };
      },
      {
         auth: true,
         detail: {
            summary: "Reject a content request",
            description:
               "Reject a pending content request. This will change the request status to 'rejected' and prevent it from being processed for content generation.",
            tags: [ApiTags.CONTENT_MANAGEMENT],
            responses: {
               200: {
                  description: "Content request rejected successfully",
               },
               404: {
                  description: "Content request not found",
               },
            },
         },
         params: _contentRequestParams,
         response: {
            200: _approveRejectResponse,
            404: _errorResponse,
         },
      },
   );
