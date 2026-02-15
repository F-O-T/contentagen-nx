import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
   createContent,
   getContentById,
   listContentsByOrganization,
   publishContent,
   updateContent,
} from "@packages/database/repositories/content-repository";
import {
   getWriterById,
   getWritersByOrganizationId,
} from "@packages/database/repositories/writer-repository";
import { z } from "zod";
import { db } from "../integrations/database";

function toSlug(title: string): string {
   return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
}

function extractAuth(extra: {
   authInfo?: { extra?: Record<string, unknown> };
}): {
   organizationId: string;
   userId: string;
} | null {
   const organizationId = extra.authInfo?.extra?.organizationId as
      | string
      | undefined;
   const userId = extra.authInfo?.extra?.userId as string | undefined;
   if (!organizationId || !userId) return null;
   return { organizationId, userId };
}

function errorResponse(message: string) {
   return {
      content: [{ type: "text" as const, text: message }],
      isError: true,
   };
}

function jsonResponse(data: unknown) {
   return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
   };
}

async function resolveMemberId(
   organizationId: string,
   userId: string,
): Promise<string | null> {
   const member = await db.query.member.findFirst({
      where: (m, { eq, and }) =>
         and(eq(m.organizationId, organizationId), eq(m.userId, userId)),
   });
   return member?.id ?? null;
}

async function resolveDefaultTeamId(
   organizationId: string,
): Promise<string | null> {
   const team = await db.query.team.findFirst({
      where: (t, { eq }) => eq(t.organizationId, organizationId),
      orderBy: (t, { asc }) => asc(t.createdAt),
   });
   return team?.id ?? null;
}

export function registerTools(server: McpServer) {
   // 1. create_content
   server.tool(
      "create_content",
      "Create a new blog post draft",
      {
         title: z.string().describe("The title of the blog post"),
         body: z.string().optional().describe("The markdown body content"),
         writerId: z
            .string()
            .uuid()
            .optional()
            .describe("Optional writer (agent) ID to associate"),
         seoDescription: z.string().optional().describe("SEO meta description"),
      },
      async (args, extra) => {
         try {
            const auth = extractAuth(extra);
            if (!auth) return errorResponse("Authentication required");

            const { organizationId, userId } = auth;

            const memberId = await resolveMemberId(organizationId, userId);
            if (!memberId)
               return errorResponse("Member not found in organization");

            const teamId = await resolveDefaultTeamId(organizationId);
            if (!teamId) return errorResponse("No team found in organization");

            const slug = toSlug(args.title);

            const result = await createContent(db, {
               organizationId,
               teamId,
               createdByMemberId: memberId,
               writerId: args.writerId,
               body: args.body ?? "",
               meta: {
                  title: args.title,
                  description: args.seoDescription ?? "",
                  slug,
               },
               status: "draft",
               draftOrigin: "manual",
            });

            return jsonResponse(result);
         } catch (err) {
            console.error("create_content failed:", err);
            return errorResponse("Failed to create content");
         }
      },
   );

   // 2. update_content
   server.tool(
      "update_content",
      "Update an existing blog post",
      {
         contentId: z.string().uuid().describe("The content ID to update"),
         title: z.string().optional().describe("New title"),
         body: z.string().optional().describe("New markdown body content"),
         seoDescription: z
            .string()
            .optional()
            .describe("New SEO meta description"),
      },
      async (args, extra) => {
         try {
            const auth = extractAuth(extra);
            if (!auth) return errorResponse("Authentication required");

            const { organizationId } = auth;

            const existing = await getContentById(db, args.contentId);
            if (!existing || existing.organizationId !== organizationId) {
               return errorResponse("Content not found");
            }

            const updates: Record<string, unknown> = {};

            if (args.body !== undefined) {
               updates.body = args.body;
            }

            if (args.title !== undefined || args.seoDescription !== undefined) {
               const currentMeta = existing.meta ?? {
                  title: "",
                  description: "",
                  slug: "",
               };
               const newTitle = args.title ?? currentMeta.title;
               const newDescription =
                  args.seoDescription ?? currentMeta.description;
               const newSlug = args.title
                  ? toSlug(args.title)
                  : currentMeta.slug;

               updates.meta = {
                  ...currentMeta,
                  title: newTitle,
                  description: newDescription,
                  slug: newSlug,
               };
            }

            if (Object.keys(updates).length === 0) {
               return errorResponse("No fields to update");
            }

            const result = await updateContent(db, args.contentId, updates);
            return jsonResponse(result);
         } catch (err) {
            console.error("update_content failed:", err);
            return errorResponse("Failed to update content");
         }
      },
   );

   // 3. publish_content
   server.tool(
      "publish_content",
      "Publish a draft blog post, making it publicly accessible",
      {
         contentId: z.string().uuid().describe("The content ID to publish"),
      },
      async (args, extra) => {
         try {
            const auth = extractAuth(extra);
            if (!auth) return errorResponse("Authentication required");

            const { organizationId } = auth;

            const existing = await getContentById(db, args.contentId);
            if (!existing || existing.organizationId !== organizationId) {
               return errorResponse("Content not found");
            }

            const result = await publishContent(db, args.contentId);
            return jsonResponse(result);
         } catch (err) {
            console.error("publish_content failed:", err);
            return errorResponse("Failed to publish content");
         }
      },
   );

   // 4. list_content
   server.tool(
      "list_content",
      "List blog posts for the organization, optionally filtered by status",
      {
         status: z
            .enum(["draft", "published", "archived"])
            .optional()
            .describe("Filter by content status"),
         limit: z
            .number()
            .int()
            .min(1)
            .max(100)
            .optional()
            .describe("Max results (default 20)"),
      },
      async (args, extra) => {
         try {
            const auth = extractAuth(extra);
            if (!auth) return errorResponse("Authentication required");

            const { organizationId } = auth;

            const result = await listContentsByOrganization(
               db,
               organizationId,
               {
                  statuses: args.status ? [args.status] : undefined,
                  limit: args.limit ?? 20,
               },
            );

            return jsonResponse(result);
         } catch (err) {
            console.error("list_content failed:", err);
            return errorResponse("Failed to list content");
         }
      },
   );

   // 5. get_writer
   server.tool(
      "get_writer",
      "Get details about a writer (AI agent) including its persona configuration",
      {
         writerId: z.string().uuid().describe("The writer ID"),
      },
      async (args, extra) => {
         try {
            const auth = extractAuth(extra);
            if (!auth) return errorResponse("Authentication required");

            const { organizationId } = auth;

            const writerResult = await getWriterById(db, args.writerId);
            if (
               !writerResult ||
               writerResult.organizationId !== organizationId
            ) {
               return errorResponse("Writer not found");
            }

            return jsonResponse(writerResult);
         } catch (err) {
            console.error("get_writer failed:", err);
            return errorResponse("Failed to get writer");
         }
      },
   );

   // 6. list_writers
   server.tool(
      "list_writers",
      "List all writers (AI agents) for the organization",
      {},
      async (_args, extra) => {
         try {
            const auth = extractAuth(extra);
            if (!auth) return errorResponse("Authentication required");

            const { organizationId } = auth;

            const result = await getWritersByOrganizationId(db, organizationId);
            return jsonResponse(result);
         } catch (err) {
            console.error("list_writers failed:", err);
            return errorResponse("Failed to list writers");
         }
      },
   );
}
