import { tool } from "ai";
import z from "zod";
import { createTavilyClient } from "@packages/tavily/client";
import { tavilySearch } from "@packages/tavily/helpers";
import { serverEnv } from "@packages/environment/server";
const inputSchema = z.object({
   query: z.string().describe("The search query to look up."),
   depth: z
      .enum(["basic", "advanced"])
      .describe("The depth of the search, either 'basic' or 'advanced'.")
      .default("basic"),
});
const tavily = createTavilyClient(serverEnv.TAVILY_API_KEY);
export const searchTool = tool({
   inputSchema,
   execute: async (input) => {
      const results = await tavilySearch(tavily, input.query, {
         searchDepth: input.depth,
      });
      return results;
   },
   name: "Web search tool",
   description:
      "Use this tool to search the web for relevant information using Tavily.",
});
