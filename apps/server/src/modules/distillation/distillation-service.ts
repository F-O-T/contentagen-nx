import { buildExtractionPrompt, buildFormattingPrompt } from "./distillation-prompts";
import { openai } from "../../integrations/openai";
import type { AgentConfig } from "../../services/agent-prompt";




export async function expandTextWithAgent(text: string, agentConfig: AgentConfig): Promise<string> {
   const prompt = buildExtractionPrompt(text, agentConfig.contentType);
   const response = await openai.chat.completions.create({
      model: "gpt-4o", // fallback if not set
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
   const response = await openai.chat.completions.create({
      model:  "gpt-4o",
      messages: [
         { role: "system", content: "You are an expert knowledge distiller." },
         { role: "user", content: prompt },
      ],
      max_tokens: 4096,
      temperature: 0.5,
   });
   return response.choices[0]?.message?.content || "";
}
