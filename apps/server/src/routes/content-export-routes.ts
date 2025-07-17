import { and, eq, desc, sql } from "drizzle-orm";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-typebox";
import { Elysia, t } from "elysia";
import { authMiddleware } from "../integrations/auth";
import { db } from "../integrations/database";
import { exportLog } from "../schemas/content-schema";

// OpenAPI Tags for route organization
enum ApiTags {
  CONTENT_EXPORT = "Content Export",
}

const _createExportLog = createInsertSchema(exportLog);
const _selectExportLog = createSelectSchema(exportLog);
const _updateExportLog = createUpdateSchema(exportLog);

const _exportLogParams = t.Object({
  id: t.String(),
});

const _listExportLogsQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
  userId: t.Optional(t.String()),
  contentId: t.Optional(t.String()),
  format: t.Optional(t.String()),
});

const _listExportLogsResponse = t.Object({
  exports: t.Array(_selectExportLog),
  pagination: t.Object({
    page: t.Number(),
    limit: t.Number(),
    total: t.Number(),
  }),
});

const _errorResponse = t.Object({
  message: t.String(),
});

export const contentExportRoutes = new Elysia({
  prefix: "/export",
  tags: [ApiTags.CONTENT_EXPORT],
})
  .use(authMiddleware)
  // Create export log
  .post(
    "/",
    async ({ body, user, set }) => {
      try {
        const { id: userId } = user;
        // Generate a unique ID for the export log
        const exportId = crypto.randomUUID();
        const [newExport] = await db
          .insert(exportLog)
          .values({
            ...body,
            id: exportId,
            userId,
          })
          .returning();
        if (!newExport) throw new Error("Failed to create export log");
        set.status = 201;
        return { export: newExport };
      } catch (error) {
        console.error("Error creating export log:", error);
        set.status = 400;
        return { message: "Failed to create export log" };
      }
    },
    {
      auth: true,
      detail: {
        summary: "Create a new export log entry",
        description: "Log a new content export operation.",
        tags: [ApiTags.CONTENT_EXPORT],
        responses: {
          201: { description: "Export log created successfully" },
          400: { description: "Invalid request data or creation failed" },
        },
      },
      body: t.Omit(_createExportLog, ["id", "userId", "createdAt"]),
      response: {
        201: t.Object({ export: _selectExportLog }),
        400: _errorResponse,
      },
    },
  )
  // List export logs
  .get(
    "/list",
    async ({ user, query }) => {
      const { id: userId } = user;
      const { page = 1, limit = 10, contentId, format } = query;
      const offset = (page - 1) * limit;
      const conditions = [eq(exportLog.userId, userId)];
      if (typeof contentId === "string" && contentId) {
        conditions.push(eq(exportLog.contentId, contentId));
      }
      import { sql } from "drizzle-orm";
      // ...
      if (typeof format === "string" && format) {
        conditions.push(sql`options->>'format' = ${format}`);
      }
      const whereClause = and(...conditions);
      const exports = await db.query.exportLog.findMany({
        where: whereClause,
        orderBy: desc(exportLog.createdAt),
        limit,
        offset,
      });
      return {
        exports,
        pagination: {
          page,
          limit,
          total: exports.length,
        },
      };
    },
    {
      auth: true,
      detail: {
        summary: "List export logs",
        description:
          "Retrieve a paginated list of export logs for the authenticated user.",
        tags: [ApiTags.CONTENT_EXPORT],
        responses: {
          200: {
            description: "List of export logs retrieved successfully",
          },
        },
      },
      query: _listExportLogsQuery,
      response: {
        200: _listExportLogsResponse,
      },
    },
  )
  // Get export log by ID
  .get(
    "/:id",
    async ({ params, user, set }) => {
      const { id } = params;
      const { id: userId } = user;
      const [exportEntry] = await db.query.exportLog.findMany({
        where: and(eq(exportLog.id, id), eq(exportLog.userId, userId)),
        limit: 1,
      });
      if (!exportEntry) {
        set.status = 404;
        return { message: "Export log not found." };
      }
      return { export: exportEntry };
    },
    {
      auth: true,
      detail: {
        summary: "Get export log details",
        description: "Retrieve details about a specific export log entry.",
        tags: [ApiTags.CONTENT_EXPORT],
        responses: {
          200: {
            description: "Export log details retrieved successfully",
          },
          404: {
            description: "Export log not found or doesn't belong to user",
          },
        },
      },
      params: _exportLogParams,
      response: {
        200: t.Object({ export: _selectExportLog }),
        404: _errorResponse,
      },
    },
  )
  // Update export log
  .patch(
    "/:id",
    async ({ params, body, user, set }) => {
      try {
        const { id } = params;
        const { id: userId } = user;
        // Check if the export log belongs to the user
        const existingExport = await db.query.exportLog.findFirst({
          where: and(eq(exportLog.id, id), eq(exportLog.userId, userId)),
        });
        if (!existingExport) {
          set.status = 404;
          return { message: "Export log not found" };
        }
        const [updatedExport] = await db
          .update(exportLog)
          .set({ ...body })
          .where(eq(exportLog.id, id))
          .returning();
        if (!updatedExport) throw new Error("Failed to update export log");
        return { export: updatedExport };
      } catch (error) {
        console.error("Error updating export log:", error);
        set.status = 400;
        return { message: "Failed to update export log" };
      }
    },
    {
      auth: true,
      detail: {
        summary: "Update an export log entry",
        description: "Update fields of an existing export log entry.",
        tags: [ApiTags.CONTENT_EXPORT],
        responses: {
          200: { description: "Export log updated successfully" },
          400: { description: "Invalid request data or update failed" },
          404: { description: "Export log not found" },
        },
      },
      params: _exportLogParams,
      body: t.Omit(_updateExportLog, ["id", "userId", "createdAt"]),
      response: {
        200: t.Object({ export: _selectExportLog }),
        400: _errorResponse,
        404: _errorResponse,
      },
    },
  )
  // Delete export log
  .delete(
    "/:id",
    async ({ params, user, set }) => {
      const { id } = params;
      const { id: userId } = user;
      // Check if the export log belongs to the user
      const existingExport = await db.query.exportLog.findFirst({
        where: and(eq(exportLog.id, id), eq(exportLog.userId, userId)),
      });
      if (!existingExport) {
        set.status = 404;
        return { message: "Export log not found" };
      }
      await db.delete(exportLog).where(eq(exportLog.id, id));
      set.status = 204;
      return {};
    },
    {
      auth: true,
      detail: {
        summary: "Delete an export log entry",
        description: "Delete an existing export log entry.",
        tags: [ApiTags.CONTENT_EXPORT],
        responses: {
          204: { description: "Export log deleted successfully" },
          404: { description: "Export log not found" },
        },
      },
      params: _exportLogParams,
      response: {
        204: t.Object({}),
        404: _errorResponse,
      },
    },
  );
