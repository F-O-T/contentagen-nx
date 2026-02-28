import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { tecoAgent } from "../agents/teco-agent";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseReviewSignal(text: string): {
   approved: boolean;
   issues: string[];
} {
   const match = text.match(/REVIEW_SIGNAL:\s*(\{.*?\})/s);
   if (!match) return { approved: false, issues: ["Could not parse review signal"] };
   try {
      // biome-ignore lint/style/noNonNullAssertion: match[1] is guaranteed when match is truthy
      return JSON.parse(match[1]!) as { approved: boolean; issues: string[] };
   } catch {
      return { approved: false, issues: ["Invalid review signal JSON"] };
   }
}

// ─── Step 1: Research ────────────────────────────────────────────────────────

const researchStep = createStep({
   id: "research",
   inputSchema: z.object({
      topic: z.string().describe("The topic or title to research"),
   }),
   outputSchema: z.object({
      briefing: z.string().describe("Research briefing for the writer"),
   }),
   execute: async ({ inputData, requestContext }) => {
      const result = await tecoAgent.generate(
         `Research this topic thoroughly and produce a structured briefing: ${inputData.topic}`,
         { requestContext },
      );
      return { briefing: result.text };
   },
});

// ─── Step 2: Write ───────────────────────────────────────────────────────────

const writeStep = createStep({
   id: "write",
   inputSchema: z.object({
      briefing: z.string(),
   }),
   outputSchema: z.object({
      message: z.string(),
   }),
   execute: async ({ inputData, requestContext }) => {
      const result = await tecoAgent.generate(
         `Using this research briefing, write a complete, publication-ready article:\n\n${inputData.briefing}`,
         { requestContext },
      );
      return { message: result.text };
   },
});

// ─── Step 3: Revision cycle (loops via dowhile) ──────────────────────────────
// Reviewer and SEO auditor run in parallel on the current editor state.
// Writer revises if reviewer does not approve.

const revisionCycleStep = createStep({
   id: "revision-cycle",
   // inputSchema matches writeStep output for type compatibility with .dowhile().
   // The step reads current editor state via agent tools — inputData is not used.
   inputSchema: z.object({
      message: z.string(),
   }),
   outputSchema: z.object({
      approved: z.boolean(),
      issues: z.array(z.string()),
      feedback: z.string(),
   }),
   execute: async ({ requestContext }) => {
      const [reviewResult, seoResult] = await Promise.all([
         tecoAgent.generate(
            "Review the current article content for quality, tone, citations, readability, and AI patterns.",
            { requestContext },
         ),
         tecoAgent.generate(
            "Audit the current article content for SEO. Apply all improvements directly.",
            { requestContext },
         ),
      ]);

      const { approved, issues } = parseReviewSignal(reviewResult.text);
      const combinedFeedback = `${reviewResult.text}\n\n---\nSEO Audit:\n${seoResult.text}`;

      if (!approved) {
         await tecoAgent.generate(
            `Revise the current article based on this feedback:\n\n${combinedFeedback}`,
            { requestContext },
         );
      }

      return {
         approved,
         issues,
         feedback: combinedFeedback,
      };
   },
});

// ─── Workflow ─────────────────────────────────────────────────────────────────

export const contentCreationWorkflow = createWorkflow({
   id: "content-creation",
   inputSchema: z.object({
      topic: z.string(),
   }),
   outputSchema: z.object({
      approved: z.boolean(),
      issues: z.array(z.string()),
      feedback: z.string(),
   }),
})
   .then(researchStep)
   .then(writeStep)
   .dowhile(
      revisionCycleStep,
      async ({ inputData, iterationCount }) =>
         !inputData.approved && iterationCount < 3,
   )
   .commit();
