import { createSdk } from "@contentagen/sdk";

const apiKey = import.meta.env.CONTENTAGEN_API_KEY;

if (!apiKey) {
   throw new Error("CONTENTAGEN_API_KEY is missing in environment variables.");
}

export const sdk = createSdk({ apiKey });
export const agentId = import.meta.env.CONTENTAGEN_AGENT_ID;
