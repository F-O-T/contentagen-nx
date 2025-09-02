import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import {
   confidenceScoringInputPrompt,
   confidenceScoringPrompt,
   confidenceScoringSchema,
   type ConfidenceScoringSchema,
} from "@packages/prompts/prompt/writing/confidence-scoring-prompt";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
//TODO: improve the rationale right now, every now and then it doesnt return in markdown correctly
export async function runConfidenceScoring(payload: {
   title: string;
   description: string;
   brandContext: string;
   keywords: string[];
   marketIntelligence: string;
}): Promise<{ score: string; rationale: string }> {
   const { title, description, brandContext, keywords, marketIntelligence } =
      payload;

   try {
      const system = confidenceScoringPrompt();
      const prompt = confidenceScoringInputPrompt(
         title,
         description,
         brandContext,
         keywords,
         marketIntelligence,
      );

      const result = await generateOpenRouterObject(
         openrouter,
         { model: "small" },
         confidenceScoringSchema,
         { prompt, system },
      );

      const { confidence } = result.object as ConfidenceScoringSchema;
      return confidence;
   } catch (error) {
      console.error("Error during confidence scoring:", error);
      // Fallback to a basic score if LLM fails
      return {
         score: "50",
         rationale:
            "Unable to generate confidence score due to technical error. Using default score.",
      };
   }
}
