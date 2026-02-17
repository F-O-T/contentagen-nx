import type { FeedbackAdapter, FeedbackPayload } from "../schemas";

const SURVEY_IDS = {
   bug_report: "019c6be5-4893-0000-7270-57dc03529638",
   feature_request: "019c6be5-5783-0000-684e-aceb5002b650",
   feature_feedback: "019c6be5-6296-0000-b0a3-2ab421e77719",
} as const;

type PostHogLike = {
   capture: (event: {
      distinctId: string;
      event: string;
      properties?: Record<string, unknown>;
   }) => void;
};

type PostHogAdapterConfig = {
   posthog: PostHogLike;
   userId: string;
};

function buildSurveyResponses(
   payload: FeedbackPayload,
): Record<string, unknown> {
   switch (payload.type) {
      case "bug_report":
         return {
            $survey_response: payload.description,
            $survey_response_1: payload.severity ?? "",
         };
      case "feature_request":
         return {
            $survey_response: payload.feature,
            $survey_response_1: payload.problem ?? "",
            $survey_response_2: payload.priority,
         };
      case "feature_feedback":
         return {
            $survey_response: payload.rating,
            $survey_response_1: payload.improvement ?? "",
            feature_name: payload.featureName,
         };
   }
}

export function posthogAdapter(config: PostHogAdapterConfig): FeedbackAdapter {
   return {
      name: "posthog",
      async send(payload) {
         const surveyId = SURVEY_IDS[payload.type];
         const responses = buildSurveyResponses(payload);

         config.posthog.capture({
            distinctId: config.userId,
            event: "survey sent",
            properties: {
               $survey_id: surveyId,
               ...responses,
            },
         });
      },
   };
}
