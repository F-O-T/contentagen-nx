//TODO: DELETAR
export function getPolarPlanBasedOnValue(value: number): POLAR_PLAN_SLUGS {
   if (value >= POLAR_PLAN_VALUES.ULTRA) {
      return POLAR_PLAN_SLUGS.ULTRA;
   }

   if (value >= POLAR_PLAN_VALUES.PRO) {
      return POLAR_PLAN_SLUGS.PRO;
   }
   return POLAR_PLAN_SLUGS.FREE;
}
export const POLAR_PLAN_VALUES = {
   PRO: 1500,
   ULTRA: 6000,
};
export const POLAR_PLAN_SLUGS = {
   FREE: "free",
   PRO: "pro",
   ULTRA: "ultra",
};
export type POLAR_PLAN_SLUGS =
   (typeof POLAR_PLAN_SLUGS)[keyof typeof POLAR_PLAN_SLUGS];
export const POLAR_BILLING_EVENTS = {
   GENERATE_CONTENT: "generated_content",
   KNOWLEDGE_CHUNK_PROCESSING: "knowledge_chunk_processing",
};

export const POLAR_FREE_PLAN_FIXED_LIMITS = {
   AGENT_SLOTS: 1,
   KNOWLEDGE_CHUNK_SLOTS: 5,
   AGENT_FILE_UPLOAD_SLOTS: 1,
};

export const POLAR_PRO_PLAN_FIXED_LIMITS = {
   AGENT_SLOTS: 3,
   KNOWLEDGE_CHUNK_SLOTS: 100,
   AGENT_FILE_UPLOAD_SLOTS: 3,
};

export const POLAR_ULTRA_PLAN_FIXED_LIMITS = {
   AGENT_SLOTS: 10,
   KNOWLEDGE_CHUNK_SLOTS: 500,
   AGENT_FILE_UPLOAD_SLOTS: 5,
};

export const POLAR_ULTRA_PLAN_MONTHLY_LIMITS = {
   GENERATE_CONTENT: 800,
   KNOWLEDGE_CHUNK_GENERATION: 50,
};

export const POLAR_PRO_PLAN_MONTHLY_LIMITS = {
   GENERATE_CONTENT: 200,
   KNOWLEDGE_CHUNK_GENERATION: 10,
};

export const POLAR_FREE_PLAN_MONTHLY_LIMITS = {
   GENERATE_CONTENT: 3,
   KNOWLEDGE_CHUNK_GENERATION: 1,
};

export function getPlanLimits(plan: POLAR_PLAN_SLUGS) {
   const plans = {
      [POLAR_PLAN_SLUGS.FREE]: {
         fixed: POLAR_FREE_PLAN_FIXED_LIMITS,
         monthly: POLAR_FREE_PLAN_MONTHLY_LIMITS,
      },
      [POLAR_PLAN_SLUGS.PRO]: {
         fixed: POLAR_PRO_PLAN_FIXED_LIMITS,
         monthly: POLAR_PRO_PLAN_MONTHLY_LIMITS,
      },
      [POLAR_PLAN_SLUGS.ULTRA]: {
         fixed: POLAR_ULTRA_PLAN_FIXED_LIMITS,
         monthly: POLAR_ULTRA_PLAN_MONTHLY_LIMITS,
      },
   };
   if (!plans[plan]) {
      throw new Error(`Unknown plan: ${plan}`);
   }
   return plans[plan];
}

export function handleContentMonthlyLimit(
   used: number,
   plan: POLAR_PLAN_SLUGS,
) {
   const { monthly } = getPlanLimits(plan);
   const limit = monthly.GENERATE_CONTENT;
   if (used >= limit) {
      throw new Error(
         `You have exceeded your ${plan} plan's content generation monthly limit.`,
      );
   }
   return {
      remaining: limit - used,
   };
}

export function handleKnowledgeProcessingMonthlyLimit(
   used: number,
   plan: POLAR_PLAN_SLUGS,
) {
   const { monthly } = getPlanLimits(plan);
   const limit = monthly.KNOWLEDGE_CHUNK_GENERATION;
   if (used >= limit) {
      throw new Error(
         `You have exceeded your ${plan} plan's knowledge processing monthly limit.`,
      );
   }
   return {
      remaining: limit - used,
   };
}

export function handleAgentSlotsLimit(used: number, plan: POLAR_PLAN_SLUGS) {
   const { fixed } = getPlanLimits(plan);
   const limit = fixed.AGENT_SLOTS;
   if (used >= limit) {
      throw new Error("You dont have enough agent slots available.");
   }
   return {
      remaining: limit - used,
   };
}

export function handleKnowledgeChunkSlotsLimit(
   used: number,
   plan: POLAR_PLAN_SLUGS,
) {
   const { fixed } = getPlanLimits(plan);
   const limit = fixed.KNOWLEDGE_CHUNK_SLOTS;
   if (used >= limit) {
      throw new Error("You dont have enough knowledge chunk slots available.");
   }
   return {
      remaining: limit - used,
   };
}

export function handleAgentFileUploadsLimit(
   used: number,
   plan: POLAR_PLAN_SLUGS,
) {
   const { fixed } = getPlanLimits(plan);
   const limit = fixed.AGENT_FILE_UPLOAD_SLOTS;
   if (used >= limit) {
      throw new Error(
         "You dont have enough agent file upload slots available.",
      );
   }
   return {
      remaining: limit - used,
   };
}
