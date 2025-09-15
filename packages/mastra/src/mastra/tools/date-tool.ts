import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const dateTool = createTool({
   id: "get-current-date",
   description: "Gets the current date in YYYY-MM-DD format",
   inputSchema: z.object({
      timezone: z.string().optional().describe("Optional timezone (e.g., 'UTC', 'America/New_York')"),
   }),
   execute: async ({ context }) => {
      const { timezone } = context;
      
      try {
         const now = new Date();
         
         if (timezone) {
            return {
               date: now.toLocaleDateString('en-CA', { 
                  timeZone: timezone,
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
               }).replace(/\//g, '-')
            };
         }
         
         const year = now.getFullYear();
         const month = String(now.getMonth() + 1).padStart(2, '0');
         const day = String(now.getDate()).padStart(2, '0');
         
         return { date: `${year}-${month}-${day}` };
      } catch (error) {
         console.error("Failed to get current date:", error);
         throw error;
      }
   },
});