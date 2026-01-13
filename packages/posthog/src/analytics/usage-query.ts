/**
 * PostHog Analytics Query Service
 *
 * Queries PostHog's HogQL API to get aggregated AI usage statistics
 * for an organization.
 */

/**
 * Usage stats for a specific AI feature
 */
export interface FeatureUsageStats {
   requests: number;
   inputTokens: number;
   outputTokens: number;
   totalTokens: number;
}

/**
 * Aggregated AI usage statistics
 */
export interface AIUsageStats {
   period: string;
   totalRequests: number;
   totalInputTokens: number;
   totalOutputTokens: number;
   totalTokens: number;
   byFeature: {
      fim: FeatureUsageStats;
      chat: FeatureUsageStats;
      edit: FeatureUsageStats;
      plan: FeatureUsageStats;
   };
}

/**
 * Parameters for querying AI usage
 */
export interface QueryUsageParams {
   organizationId: string;
   startDate: Date;
   endDate: Date;
}

/**
 * Query AI usage statistics from PostHog using HogQL
 * Queries the pre-computed llm_usage_monthly materialized view for fast results
 */
export async function queryAIUsage(
   posthogHost: string,
   posthogApiKey: string,
   projectId: string,
   params: QueryUsageParams,
): Promise<AIUsageStats> {
   const { organizationId, startDate } = params;

   // Query the materialized view for fast results
   const query = `
      SELECT
         total_requests,
         input_tokens,
         output_tokens,
         total_tokens,
         fim_requests,
         fim_tokens,
         fim_input_tokens,
         fim_output_tokens,
         chat_requests,
         chat_tokens,
         chat_input_tokens,
         chat_output_tokens,
         edit_requests,
         edit_tokens,
         edit_input_tokens,
         edit_output_tokens,
         plan_requests,
         plan_tokens,
         plan_input_tokens,
         plan_output_tokens
      FROM llm_usage_monthly
      WHERE organization_id = '${organizationId}'
        AND month = toStartOfMonth(toDateTime('${startDate.toISOString()}'))
   `;

   const response = await fetch(
      `${posthogHost}/api/projects/${projectId}/query/`,
      {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${posthogApiKey}`,
         },
         body: JSON.stringify({
            query: {
               kind: "HogQLQuery",
               query,
            },
         }),
      },
   );

   if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PostHog query failed: ${response.statusText} - ${errorText}`);
   }

   const result = (await response.json()) as {
      results?: unknown[][];
      columns?: string[];
   };

   // Transform the result into AIUsageStats format
   return transformQueryResult(result, params);
}

/**
 * Transform PostHog query result into AIUsageStats
 */
function transformQueryResult(
   result: {
      results?: unknown[][];
      columns?: string[];
   },
   params: QueryUsageParams,
): AIUsageStats {
   // Default empty stats
   const emptyStats: AIUsageStats = {
      period: `${params.startDate.toISOString().split("T")[0]} - ${params.endDate.toISOString().split("T")[0]}`,
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      byFeature: {
         fim: { requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 },
         chat: { requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 },
         edit: { requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 },
         plan: { requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      },
   };

   if (!result.results || result.results.length === 0) {
      return emptyStats;
   }

   // Get the first (and only) row
   const row = result.results[0];
   if (!row) {
      return emptyStats;
   }
   
   const columns = result.columns || [];

   // Create a map of column name to value
   const data: Record<string, number> = {};
   columns.forEach((col, idx) => {
      data[col as string] = Number(row[idx]) || 0;
   });

   return {
      period: emptyStats.period,
      totalRequests: data.total_requests || 0,
      totalInputTokens: data.input_tokens || 0,
      totalOutputTokens: data.output_tokens || 0,
      totalTokens: data.total_tokens || 0,
      byFeature: {
         fim: {
            requests: data.fim_requests || 0,
            inputTokens: data.fim_input_tokens || 0,
            outputTokens: data.fim_output_tokens || 0,
            totalTokens: data.fim_tokens || 0,
         },
         chat: {
            requests: data.chat_requests || 0,
            inputTokens: data.chat_input_tokens || 0,
            outputTokens: data.chat_output_tokens || 0,
            totalTokens: data.chat_tokens || 0,
         },
         edit: {
            requests: data.edit_requests || 0,
            inputTokens: data.edit_input_tokens || 0,
            outputTokens: data.edit_output_tokens || 0,
            totalTokens: data.edit_tokens || 0,
         },
         plan: {
            requests: data.plan_requests || 0,
            inputTokens: data.plan_input_tokens || 0,
            outputTokens: data.plan_output_tokens || 0,
            totalTokens: data.plan_tokens || 0,
         },
      },
   };
}
