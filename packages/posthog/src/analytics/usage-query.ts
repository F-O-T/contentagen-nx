/**
 * PostHog Analytics Query Service
 *
 * Queries PostHog's HogQL API to get aggregated AI usage statistics
 * for an organization.
 */

import { env } from "@packages/environment/server";

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
 * Daily usage statistics for trend charts
 */
export interface DailyUsageStats {
   date: string; // YYYY-MM-DD
   requests: number;
   inputTokens: number;
   outputTokens: number;
   totalTokens: number;
}

/**
 * Acceptance rate statistics for AI suggestions
 */
export interface AcceptanceRateStats {
   feature: "fim" | "edit";
   shown: number;
   accepted: number;
   rejected: number;
   acceptanceRate: number; // 0-100 percentage
}

/**
 * Previous month statistics for comparison
 */
export interface PreviousMonthStats {
   totalRequests: number;
   totalTokens: number;
}

/**
 * Comparison percentages between current and previous month
 */
export interface ComparisonStats {
   requestsChange: number; // percentage change
   tokensChange: number; // percentage change
}

/**
 * Extended AI usage statistics with charts data
 */
export interface ExtendedAIUsageStats extends AIUsageStats {
   dailyUsage: DailyUsageStats[];
   acceptanceRates: AcceptanceRateStats[];
   previousMonth: PreviousMonthStats;
   comparison: ComparisonStats;
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
 * Extended parameters including previous month for comparison
 */
export interface ExtendedQueryUsageParams extends QueryUsageParams {
   previousMonthStart: Date;
   previousMonthEnd: Date;
}

/**
 * Query AI usage statistics from PostHog using HogQL
 * Queries the pre-computed llm_usage_monthly materialized view for fast results
 */
export async function queryAIUsage(
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
      `${env.POSTHOG_HOST}/api/projects/${env.POSTHOG_PROJECT_ID}/query/`,
      {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.POSTHOG_PERSONAL_API_KEY}`,
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
      throw new Error(
         `PostHog query failed: ${response.statusText} - ${errorText}`,
      );
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

/**
 * Execute a HogQL query against PostHog
 */
async function executeHogQLQuery(
   query: string,
): Promise<{ results?: unknown[][]; columns?: string[] }> {
   const response = await fetch(
      `${env.POSTHOG_HOST}/api/projects/${env.POSTHOG_PROJECT_ID}/query/`,
      {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.POSTHOG_PERSONAL_API_KEY}`,
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
      throw new Error(
         `PostHog query failed: ${response.statusText} - ${errorText}`,
      );
   }

   return response.json() as Promise<{
      results?: unknown[][];
      columns?: string[];
   }>;
}

/**
 * Query daily usage breakdown from PostHog events
 */
export async function queryDailyUsage(
   params: QueryUsageParams,
): Promise<DailyUsageStats[]> {
   const { organizationId, startDate, endDate } = params;

   const query = `
      SELECT
         toDate(timestamp) as date,
         count(*) as requests,
         sum(ifNull(toInt(properties.inputTokens), 0)) as input_tokens,
         sum(ifNull(toInt(properties.outputTokens), 0)) as output_tokens,
         sum(ifNull(toInt(properties.totalTokens), 0)) as total_tokens
      FROM events
      WHERE 
         event IN ('llm_fim_generated', 'llm_edit_generated', 'llm_chat_response_complete', 'llm_plan_created')
         AND properties.$group_organization = '${organizationId}'
         AND timestamp >= toDateTime('${startDate.toISOString()}')
         AND timestamp < toDateTime('${endDate.toISOString()}')
      GROUP BY date
      ORDER BY date
   `;

   const result = await executeHogQLQuery(query);

   if (!result.results || result.results.length === 0) {
      return [];
   }

   const columns = result.columns || [];
   return result.results.map((row) => {
      const data: Record<string, unknown> = {};
      columns.forEach((col, idx) => {
         data[col as string] = row[idx];
      });

      return {
         date: String(data.date || ""),
         requests: Number(data.requests) || 0,
         inputTokens: Number(data.input_tokens) || 0,
         outputTokens: Number(data.output_tokens) || 0,
         totalTokens: Number(data.total_tokens) || 0,
      };
   });
}

/**
 * Query acceptance rates for FIM and Edit features
 */
export async function queryAcceptanceRates(
   params: QueryUsageParams,
): Promise<AcceptanceRateStats[]> {
   const { organizationId, startDate, endDate } = params;

   // Query FIM acceptance stats
   const fimQuery = `
      SELECT
         countIf(event = 'llm_fim_shown') as shown,
         countIf(event = 'llm_fim_accepted') as accepted,
         countIf(event = 'llm_fim_rejected') as rejected
      FROM events
      WHERE 
         event IN ('llm_fim_shown', 'llm_fim_accepted', 'llm_fim_rejected')
         AND properties.$group_organization = '${organizationId}'
         AND timestamp >= toDateTime('${startDate.toISOString()}')
         AND timestamp < toDateTime('${endDate.toISOString()}')
   `;

   // Query Edit acceptance stats
   const editQuery = `
      SELECT
         countIf(event = 'llm_edit_requested') as shown,
         countIf(event = 'llm_edit_accepted') as accepted,
         countIf(event = 'llm_edit_rejected') as rejected
      FROM events
      WHERE 
         event IN ('llm_edit_requested', 'llm_edit_accepted', 'llm_edit_rejected')
         AND properties.$group_organization = '${organizationId}'
         AND timestamp >= toDateTime('${startDate.toISOString()}')
         AND timestamp < toDateTime('${endDate.toISOString()}')
   `;

   const [fimResult, editResult] = await Promise.all([
      executeHogQLQuery(fimQuery),
      executeHogQLQuery(editQuery),
   ]);

   const parseResult = (
      result: { results?: unknown[][]; columns?: string[] },
      feature: "fim" | "edit",
   ): AcceptanceRateStats => {
      if (!result.results || result.results.length === 0) {
         return {
            feature,
            shown: 0,
            accepted: 0,
            rejected: 0,
            acceptanceRate: 0,
         };
      }

      const row = result.results[0];
      const columns = result.columns || [];
      const data: Record<string, number> = {};
      columns.forEach((col, idx) => {
         data[col as string] = Number(row?.[idx]) || 0;
      });

      const shown = data.shown || 0;
      const accepted = data.accepted || 0;
      const rejected = data.rejected || 0;
      const acceptanceRate = shown > 0 ? (accepted / shown) * 100 : 0;

      return { feature, shown, accepted, rejected, acceptanceRate };
   };

   return [parseResult(fimResult, "fim"), parseResult(editResult, "edit")];
}

/**
 * Query previous month usage for comparison
 */
export async function queryPreviousMonth(
   organizationId: string,
   previousMonthStart: Date,
): Promise<PreviousMonthStats> {
   const query = `
      SELECT
         total_requests,
         total_tokens
      FROM llm_usage_monthly
      WHERE organization_id = '${organizationId}'
        AND month = toStartOfMonth(toDateTime('${previousMonthStart.toISOString()}'))
   `;

   const result = await executeHogQLQuery(query);

   if (!result.results || result.results.length === 0) {
      return { totalRequests: 0, totalTokens: 0 };
   }

   const row = result.results[0];
   const columns = result.columns || [];
   const data: Record<string, number> = {};
   columns.forEach((col, idx) => {
      data[col as string] = Number(row?.[idx]) || 0;
   });

   return {
      totalRequests: data.total_requests || 0,
      totalTokens: data.total_tokens || 0,
   };
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentageChange(current: number, previous: number): number {
   if (previous === 0) {
      return current > 0 ? 100 : 0;
   }
   return ((current - previous) / previous) * 100;
}

/**
 * Query extended AI usage statistics including charts data
 * Combines monthly totals, daily breakdown, acceptance rates, and comparison
 */
export async function queryExtendedUsage(
   params: ExtendedQueryUsageParams,
): Promise<ExtendedAIUsageStats> {
   const { organizationId, startDate, endDate, previousMonthStart } = params;

   // Run all queries in parallel for efficiency
   const [baseStats, dailyUsage, acceptanceRates, previousMonth] =
      await Promise.all([
         queryAIUsage({
            organizationId,
            startDate,
            endDate,
         }),
         queryDailyUsage({
            organizationId,
            startDate,
            endDate,
         }),
         queryAcceptanceRates({
            organizationId,
            startDate,
            endDate,
         }),
         queryPreviousMonth(organizationId, previousMonthStart),
      ]);

   // Calculate comparison percentages
   const comparison: ComparisonStats = {
      requestsChange: calculatePercentageChange(
         baseStats.totalRequests,
         previousMonth.totalRequests,
      ),
      tokensChange: calculatePercentageChange(
         baseStats.totalTokens,
         previousMonth.totalTokens,
      ),
   };

   return {
      ...baseStats,
      dailyUsage,
      acceptanceRates,
      previousMonth,
      comparison,
   };
}
