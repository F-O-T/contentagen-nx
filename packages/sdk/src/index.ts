import { createAuthClient } from "@packages/authentication/client";
import SuperJSON from "superjson";
import { z } from "zod";
import type { ContentSelect } from "@packages/database/schemas/content";
export const ListContentByAgentInputSchema = z.object({
   agentId: z.uuid("Invalid Agent ID format."),
   limit: z.number().min(1).max(100).optional().default(10),
   page: z.number().min(1).optional().default(1),
});

export const GetContentByIdInputSchema = z.object({
   id: z.uuid("Invalid Content ID format."),
});

const PRODUCTION_API_URL = "https://api.contentagen.com";

export interface SdkConfig {
   apiKey: string;
}

export class ContentaGenSDK {
   public auth;
   private trpcUrl: string;
   private apiKey: string;

   constructor(config: SdkConfig) {
      if (!config.apiKey) {
         throw new Error("apiKey is required to initialize the ContentaGenSDK");
      }

      const baseUrl = PRODUCTION_API_URL;

      this.auth = createAuthClient({ apiBaseUrl: baseUrl });
      this.trpcUrl = `${baseUrl}/trpc`;
      this.apiKey = config.apiKey;
   }

   private async _query<T>(path: string, input: unknown): Promise<T> {
      const url = new URL(`${this.trpcUrl}/${path}`);
      if (input) {
         url.searchParams.set("input", SuperJSON.stringify({ json: input }));
      }

      const response = await fetch(url.toString(), {
         headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (!response.ok) {
         throw new Error(`API request failed: ${response.statusText}`);
      }

      const json = await response.json();
      if (json.result?.data) {
         return SuperJSON.deserialize(json.result.data);
      }
      throw new Error("Invalid API response format.");
   }

   async listContentByAgent(
      params: z.input<typeof ListContentByAgentInputSchema>,
   ): Promise<ContentSelect[]> {
      try {
         const validatedParams = ListContentByAgentInputSchema.parse(params);
         return this._query("content.list", validatedParams);
      } catch (error) {
         if (error instanceof z.ZodError) {
            throw new Error(
               `Invalid input for listContentByAgent: ${error.errors.map((e) => e.message).join(", ")}`,
            );
         }
         throw error;
      }
   }

   async getContentById(
      params: z.input<typeof GetContentByIdInputSchema>,
   ): Promise<ContentSelect> {
      try {
         const validatedParams = GetContentByIdInputSchema.parse(params);
         return this._query("content.get", validatedParams);
      } catch (error) {
         if (error instanceof z.ZodError) {
            throw new Error(
               `Invalid input for getContentById: ${error.errors.map((e) => e.message).join(", ")}`,
            );
         }
         throw error;
      }
   }
}

export const createSdk = (config: SdkConfig): ContentaGenSDK => {
   return new ContentaGenSDK(config);
};
