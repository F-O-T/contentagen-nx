import { createAuthClient } from "@packages/authentication/client";
import { ContentSelectSchema } from "@packages/database/schemas/content";
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
   apiUrl?: string;
}

export class ContentaGenSDK {
   public auth;
   private trpcUrl: string;
   private apiKey: string;

   constructor(config: SdkConfig) {
      if (!config.apiKey) {
         throw new Error("apiKey is required to initialize the ContentaGenSDK");
      }

      const baseUrl = config.apiUrl ?? PRODUCTION_API_URL;

      this.auth = createAuthClient({ apiBaseUrl: baseUrl });
      this.trpcUrl = `${baseUrl}/trpc`;
      this.apiKey = config.apiKey;
   }

   private async _query<T>(
      path: string,
      input: unknown,
      schema: z.ZodType<T>,
   ): Promise<T> {
      const url = new URL(`${this.trpcUrl}/${path}`);
      if (input) {
         url.searchParams.set("input", SuperJSON.stringify(input));
      }

      console.log("SDK making request to:", url.toString());
      console.log("SDK request headers:", { "sdk-api-key": this.apiKey });

      const response = await fetch(url.toString(), {
         headers: { "sdk-api-key": this.apiKey },
      });

      console.log("SDK response status:", response.status, response.statusText);

      if (!response.ok) {
         const errorText = await response.text();
         console.log("SDK error response:", errorText);
         throw new Error(`API request failed: ${response.statusText}`);
      }

      const json = await response.json();
      console.log("SDK received response:", JSON.stringify(json, null, 2));
      
      if (
         json &&
         typeof json === "object" &&
         "result" in json &&
         json.result &&
         typeof json.result === "object" &&
         "data" in json.result
      ) {
         // The data from TRPC is already deserialized and in the correct format
         const responseData = json.result.data;
         console.log("Response data:", responseData);
         
         // Extract the actual data from the TRPC response structure
         // TRPC wraps the data with SuperJSON metadata
         const actualData =  responseData;
         console.log("Actual data for validation:", actualData);
         
         return schema.parse(actualData);
      }
      throw new Error("Invalid API response format.");
   }
   async listContentByAgent(
      params: z.input<typeof ListContentByAgentInputSchema>,
   ): Promise<ContentSelect[]> {
      try {
         const validatedParams = ListContentByAgentInputSchema.parse(params);
         return this._query(
            "sdk.listContentByAgent",
            validatedParams,
            ContentSelectSchema.array(),
         );
      } catch (error) {
         if (error instanceof z.ZodError) {
            throw new Error(
               `Invalid input for listContentByAgent: ${error.issues.map((e) => e.message).join(", ")}`,
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
         return this._query(
            "sdk.getContentById",
            validatedParams,
            ContentSelectSchema,
         );
      } catch (error) {
         if (error instanceof z.ZodError) {
            throw new Error(
               `Invalid input for getContentById: ${error.issues.map((e) => e.message).join(", ")}`,
            );
         }
         throw error;
      }
   }
}

export const createSdk = (config: SdkConfig): ContentaGenSDK => {
   return new ContentaGenSDK(config);
};
