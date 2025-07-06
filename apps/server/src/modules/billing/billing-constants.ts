// Remove this file after migration is complete. Constants are now in @billing-limits.

export const BILLING_EVENTS = {
   AGENT_SLOTS: "agent_slots",
   GENERATE_CONTENT: "generated_content",
   KNOWLEDGE_CHUNK_SLOTS: "knowledge_chunk_slots",
};

export const POLAR_FREE_PLAN_FIXED_LIMITS = {
   AGENT_SLOTS: 1,
   KNOWLEDGE_CHUNK_SLOTS: 100,
};

export const POLAR_PREMIUM_PLAN_FIXED_LIMITS = {
   AGENT_SLOTS: 5,
   KNOWLEDGE_CHUNK_SLOTS: 600,
};
export const POLAR_ULTRA_PLAN_FIXED_LIMITS = {
   AGENT_SLOTS: 10,
   KNOWLEDGE_CHUNK_SLOTS: 1200,
};
