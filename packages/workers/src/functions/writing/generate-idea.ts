import { z } from "zod";
import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

export const ideaSchema = z.object({
   ideas: z
      .array(z.string().describe("a good ideia for a blog post"))
      .describe("list of blog post ideas"),
});

export async function runGenerateIdea(payload: {
   brandContext: string;
   webSnippets: string;
   keywords: string[];
}) {
   const { brandContext, webSnippets, keywords } = payload;
   try {
      const prompt = `Generate five unique and engaging blog post ideas for the brand based on the provided context, web search findings, and target keywords. Each idea should be highly creative, relevant to the brand, and represent a different angle or topic. For each, provide a catchy title and a one-sentence description suitable for attracting readers. Focus on originality and make sure the ideas reflect the brand’s values and current online trends.\n\nBrand context:\n${brandContext}\n\nWeb search findings:\n${webSnippets}\n\nKeywords: ${keywords.join(", ")}`;
      const system =
         "You are a creative content strategist for a brand. Generate a handful of unique and engaging blog post ideas.";
      const result = await generateOpenRouterObject(
         openrouter,
         { model: "small" },
         ideaSchema,
         { prompt, system },
      );
      const { ideas } = result.object as z.infer<typeof ideaSchema>;
      return { ideas };
   } catch (error) {
      console.error("Error during idea generation:", error);
      throw error;
   }
}
