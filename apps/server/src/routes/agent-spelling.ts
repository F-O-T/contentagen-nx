import { createRequestContext, mastra } from "@packages/agents";
import {
   captureAIGeneration,
   generateTraceId,
} from "@packages/posthog/llm/ai-generation";
import { Elysia, t } from "elysia";
import { auth } from "../integrations/auth";
import { db } from "../integrations/database";
import { posthog } from "../integrations/posthog";
import { Feature, requireFeatureAccess } from "../utils/feature-gate";
import { resolveOrganizationId } from "../utils/resolve-organization";

export const agentSpellingRoutes = new Elysia({
   prefix: "/api/agent/spelling",
}).post(
   "/check",
   async ({ body, request }) => {
      // Validate session
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
         throw new Error("Unauthorized");
      }

      // Resolve organization from headers
      const organizationId = await resolveOrganizationId(
         db,
         session.user.id,
         request.headers,
         session.session.activeOrganizationId,
      );

      // Check feature access (spelling check requires LITE plan or higher)
      await requireFeatureAccess(
         Feature.QUICK_EDIT,
         organizationId,
         request.headers,
      );

      const { text } = body;

      // Don't check very short text
      if (text.trim().length < 10) {
         return { errors: [], latencyMs: 0 };
      }

      // Create request context
      const requestContext = createRequestContext({
         userId: session.user.id,
      });

      // Get the spelling grammar agent
      const agent = mastra.getAgent("spellingGrammarAgent");

      const startTime = Date.now();
      const traceId = generateTraceId(); // For PostHog LLM Analytics

      try {
         // Generate (non-streaming) for complete JSON response
         const result = await agent.generate(
            [
               {
                  role: "user",
                  content: text,
               },
            ],
            {
               requestContext,
            },
         );

         // Parse JSON from response - handle potential markdown code blocks
         let jsonText = result.text.trim();

         // Remove markdown code blocks if present
         if (jsonText.startsWith("```")) {
            jsonText = jsonText
               .replace(/^```(?:json)?\n?/, "")
               .replace(/\n?```$/, "");
         }

         // Find JSON object in response
         const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
         if (!jsonMatch) {
            console.warn(
               "No JSON found in spelling check response:",
               result.text,
            );
            return { errors: [], latencyMs: Date.now() - startTime };
         }

         const parsed = JSON.parse(jsonMatch[0]);

         // Validate and sanitize errors
         const errors = Array.isArray(parsed.errors)
            ? parsed.errors
                 .filter(
                    (err: unknown) =>
                       typeof err === "object" &&
                       err !== null &&
                       "type" in err &&
                       "original" in err &&
                       "suggestion" in err &&
                       "offset" in err &&
                       "length" in err,
                 )
                 .map(
                    (
                       err: {
                          type: string;
                          original: string;
                          suggestion: string;
                          offset: number;
                          length: number;
                          message?: string;
                       },
                       index: number,
                    ) => ({
                       id: `${err.type}-${err.offset}-${index}`,
                       type: err.type === "grammar" ? "grammar" : "spelling",
                       original: String(err.original),
                       suggestion: String(err.suggestion),
                       offset: Number(err.offset),
                       length: Number(err.length),
                       message: String(err.message || ""),
                    }),
                 )
            : [];

         // Capture $ai_generation for PostHog LLM Analytics (developer debugging)
         captureAIGeneration({
            posthog,
            distinctId: session.user.id,
            traceId,
            model: "openrouter/mistralai/mistral-small-creative",
            input: [{ role: "user", content: text }],
            outputChoices: [{ role: "assistant", content: result.text }],
            inputTokens: result.usage?.inputTokens ?? 0,
            outputTokens: result.usage?.outputTokens ?? 0,
            latencySeconds: (Date.now() - startTime) / 1000,
            mode: "spelling",
            // Custom properties for spelling debugging
            errorCount: errors.length,
         });

         return {
            errors,
            latencyMs: Date.now() - startTime,
         };
      } catch (error) {
         console.error("Spelling check error:", error);
         return {
            errors: [],
            error: (error as Error).message,
            latencyMs: Date.now() - startTime,
         };
      }
   },
   {
      body: t.Object({
         text: t.String({ minLength: 1, maxLength: 15000 }),
      }),
   },
);
