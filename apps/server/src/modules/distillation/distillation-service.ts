import {
   buildExtractionPrompt,
   buildFormattingPrompt,
} from "./distillation-prompts";
import { openRouter } from "@api/integrations/openrouter";
import type { AgentConfig } from "@api/services/agent-prompt";
import { DISTILL_CONFIG } from "./distillation-utils";
export async function expandTextWithAgent(
   text: string,
   agentConfig: AgentConfig,
): Promise<string> {
   const prompt = buildExtractionPrompt(text, agentConfig.contentType);
   const response = await openRouter.chat.completions.create({
      model: DISTILL_CONFIG.MODEL,
      messages: [
         { role: "system", content: "You are an expert content expander." },
         { role: "user", content: prompt },
      ],
      max_tokens: 4096,
      temperature: 0.8,
   });
   return response.choices[0]?.message?.content || "";
}

/**
 * Step 2: Distills the expanded text into concise, actionable knowledge using the agent (LLM).
 */
export async function distillTextWithAgent(): Promise<string> {
   const prompt = buildFormattingPrompt();
   const response = await openRouter.chat.completions.create({
      model: DISTILL_CONFIG.MODEL,
      messages: [
         { role: "system", content: "You are an expert knowledge distiller." },
         { role: "user", content: prompt },
      ],
      max_tokens: 4096,
      temperature: 0.5,
   });
   return response.choices[0]?.message?.content || "";
}
