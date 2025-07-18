import knowledgeDistillationPrompts from "./prompt-files/knowledge-distillation.json";

export type PromptType = "low" | "medium" | "high";
export type StageMap = Record<string, string>;
export type KnowledgeDistillationPrompts = Record<PromptType, StageMap>;

const promptData = knowledgeDistillationPrompts as KnowledgeDistillationPrompts;

export function getPromptStagesByType(type?: PromptType) {
   const types: PromptType[] = ["low", "medium", "high"];
   const result: Record<PromptType, string[]> = {
      low: [],
      medium: [],
      high: [],
   };
   for (const t of types) {
      if (promptData[t]) {
         const stages = Object.keys(promptData[t])
            .filter((k) => k.startsWith("stage-"))
            .sort((a, b) => {
               const na = parseInt(a.split("-")[1] ?? "0", 10);
               const nb = parseInt(b.split("-")[1] ?? "0", 10);
               return na - nb;
            })
            .map((stageKey) => {
               const val = promptData[t][stageKey];
               if (typeof val !== "string")
                  throw new Error(`Missing stage ${stageKey} for type ${t}`);
               return val;
            });
         result[t] = stages;
      }
   }
   if (type) {
      return result[type] || [];
   }
   return result;
}

export * from "./helpers/knowledge-distillation";
