import { createTool } from "@mastra/core/tools";
import { AppError, propagateError } from "@packages/utils/errors";
import { z } from "zod";

export const dateTool = createTool({
   description: "Gets the current date in YYYY-MM-DD format",
   execute: async (inputData) => {
      const { timezone } = inputData;

      try {
         const now = new Date();

         if (timezone) {
            return {
               date: now
                  .toLocaleDateString("en-CA", {
                     day: "2-digit",
                     month: "2-digit",
                     timeZone: timezone,
                     year: "numeric",
                  })
                  .replace(/\//g, "-"),
            };
         }

         const year = now.getFullYear();
         const month = String(now.getMonth() + 1).padStart(2, "0");
         const day = String(now.getDate()).padStart(2, "0");

         return { date: `${year}-${month}-${day}` };
      } catch (error) {
         console.error("Failed to get current date:", error);
         propagateError(error);
         throw AppError.internal(
            `Failed to get current date: ${(error as Error).message}`,
         );
      }
   },
   id: "get-current-date",
   inputSchema: z.object({
      timezone: z
         .string()
         .optional()
         .describe("Optional timezone (e.g., 'UTC', 'America/New_York')"),
   }),
});
