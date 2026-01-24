import { PlanName } from "./constants";

/**
 * Feature flags for plan-based access control.
 * Each feature can be gated to specific plans.
 */
export enum Feature {
   // AI Features
   FIM = "fim", // Fill-in-the-Middle completion
   QUICK_EDIT = "quick_edit", // Inline AI text transformation
   CHAT = "chat", // AI Chat (Writer mode - direct editing)
   CHAT_PLAN_MODE = "chat_plan_mode", // AI Chat Plan mode (research & planning)
   WRITER_AI = "writer_ai", // AI-powered writer execution
   AGENT_INSTRUCTIONS = "agent_instructions", // Custom agent instructions
   AGENT_MEMORIES = "agent_memories", // Agent memory/context retention

   // Core Features
   CONTENT_EDITOR = "content_editor", // Basic content editing
   CONTENT_ANALYSIS = "content_analysis", // SEO/readability analysis
   RELATED_CONTENT = "related_content", // Related posts management

   // Advanced Features
   AUTOMATIONS = "automations", // Workflow automations
   ADVANCED_ANALYTICS = "advanced_analytics", // Advanced reporting
   API_ACCESS = "api_access", // API key management UI (LITE+)
   SDK_ACCESS = "sdk_access", // Basic SDK read access (all plans)
}

/**
 * Mapping of plans to available features.
 * Higher plans include all features from lower plans.
 */
export const PLAN_FEATURES: Record<PlanName, Feature[]> = {
   [PlanName.FREE]: [
      Feature.CONTENT_EDITOR,
      Feature.CONTENT_ANALYSIS,
      Feature.RELATED_CONTENT,
      // SDK access for static builds (limited rate)
      Feature.SDK_ACCESS,
   ],
   [PlanName.LITE]: [
      // Includes all FREE features
      Feature.CONTENT_EDITOR,
      Feature.CONTENT_ANALYSIS,
      Feature.RELATED_CONTENT,
      // Plus LITE-specific AI features
      Feature.FIM,
      Feature.QUICK_EDIT,
      // Chat in Writer mode (direct editing only, no planning)
      Feature.CHAT,
      Feature.WRITER_AI,
      // SDK/API access
      Feature.SDK_ACCESS,
      Feature.API_ACCESS,
   ],
   [PlanName.PRO]: [
      // Includes all LITE features
      Feature.CONTENT_EDITOR,
      Feature.CONTENT_ANALYSIS,
      Feature.RELATED_CONTENT,
      Feature.FIM,
      Feature.QUICK_EDIT,
      // Plus PRO-specific features
      Feature.CHAT,
      Feature.CHAT_PLAN_MODE, // Plan mode for research & planning
      Feature.WRITER_AI,
      Feature.AGENT_INSTRUCTIONS,
      Feature.AGENT_MEMORIES,
      Feature.AUTOMATIONS,
      Feature.ADVANCED_ANALYTICS,
      Feature.SDK_ACCESS,
      Feature.API_ACCESS,
   ],
};

/**
 * Helper to check if a plan has access to a specific feature.
 */
export function planHasFeature(plan: PlanName, feature: Feature): boolean {
   return PLAN_FEATURES[plan]?.includes(feature) ?? false;
}

/**
 * Get the minimum plan required for a specific feature.
 */
export function getMinimumPlanForFeature(feature: Feature): PlanName {
   const planOrder: PlanName[] = [PlanName.FREE, PlanName.LITE, PlanName.PRO];

   for (const plan of planOrder) {
      if (PLAN_FEATURES[plan].includes(feature)) {
         return plan;
      }
   }

   // Default to PRO if feature not found in any plan
   return PlanName.PRO;
}

/**
 * Feature display names for UI.
 */
export const FEATURE_DISPLAY_NAMES: Record<Feature, string> = {
   [Feature.FIM]: "Autocompletar com IA",
   [Feature.QUICK_EDIT]: "Edição rápida com IA",
   [Feature.CHAT]: "Chat com IA",
   [Feature.CHAT_PLAN_MODE]: "Modo Planejamento",
   [Feature.WRITER_AI]: "Escritor IA",
   [Feature.AGENT_INSTRUCTIONS]: "Instruções personalizadas",
   [Feature.AGENT_MEMORIES]: "Memória do agente",
   [Feature.CONTENT_EDITOR]: "Editor de conteúdo",
   [Feature.CONTENT_ANALYSIS]: "Análise de conteúdo",
   [Feature.RELATED_CONTENT]: "Posts relacionados",
   [Feature.AUTOMATIONS]: "Automações",
   [Feature.ADVANCED_ANALYTICS]: "Relatórios avançados",
   [Feature.API_ACCESS]: "Acesso à API",
   [Feature.SDK_ACCESS]: "Acesso ao SDK",
};
