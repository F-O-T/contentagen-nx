import {
   bugReportSchema,
   featureFeedbackSchema,
   featureRequestSchema,
} from "@packages/feedback/schemas";
import { createFeedbackSender } from "@packages/feedback/sender";
import { authenticatedProcedure } from "../server";

// =============================================================================
// Procedures
// =============================================================================

export const submitBugReport = authenticatedProcedure
   .input(bugReportSchema.omit({ type: true }))
   .handler(async ({ context, input }) => {
      const sender = createFeedbackSender({
         posthog: context.posthog,
         userId: context.userId,
      });
      await sender.send({ type: "bug_report", ...input });
      return { success: true };
   });

export const submitFeatureRequest = authenticatedProcedure
   .input(featureRequestSchema.omit({ type: true }))
   .handler(async ({ context, input }) => {
      const sender = createFeedbackSender({
         posthog: context.posthog,
         userId: context.userId,
      });
      await sender.send({ type: "feature_request", ...input });
      return { success: true };
   });

export const submitFeatureFeedback = authenticatedProcedure
   .input(featureFeedbackSchema.omit({ type: true }))
   .handler(async ({ context, input }) => {
      const sender = createFeedbackSender({
         posthog: context.posthog,
         userId: context.userId,
      });
      await sender.send({ type: "feature_feedback", ...input });
      return { success: true };
   });
