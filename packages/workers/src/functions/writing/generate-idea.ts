import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import {
   blogIdeasInputPrompt,
   blogIdeasPrompt,
   ideaSchema,
   type IdeaSchema,
} from "@packages/prompts/prompt/writing/blog-ideas-prompt";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

export async function runGenerateIdea(payload: {
   brandContext: string;
   webSnippets: string;
   keywords: string[];
}) {
   const { brandContext, webSnippets, keywords } = payload;
   try {
      const system = blogIdeasPrompt();
      const prompt = blogIdeasInputPrompt(brandContext, webSnippets, keywords);

      const result = await generateOpenRouterObject(
         openrouter,
         { model: "small" },
         ideaSchema,
         { prompt, system },
      );

      const { ideas } = result.object as IdeaSchema;
      return { ideas };
   } catch (error) {
      console.error("Error during idea generation:", error);
      throw error;
   }
}
