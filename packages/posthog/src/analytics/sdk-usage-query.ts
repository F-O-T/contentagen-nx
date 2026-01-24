/**
 * SDK Usage Query Functions for PostHog
 *
 * These functions query PostHog for aggregated SDK usage statistics.
 * The queries are designed to work with the `sdk_usage_monthly` materialized view
 * for fast, pre-computed results.
 */

import { env } from "@packages/environment/server";

export interface SDKUsageStats {
   period: string;
   totalRequests: number;
   byEndpoint: {
      author: number;
      list: number;
      content: number;
      image: number;
   };
   successRates: {
      author: number;
      content: number;
   };
   performance: {
      avgLatencyMs: number;
      maxLatencyMs: number;
   };
   errors: {
      total: number;
      authFailed: number;
   };
}

export interface SDKQueryUsageParams {
   organizationId: string;
   startDate: Date;
   endDate: Date;
}

export interface PostHogQueryResponse {
   results: unknown[][];
   columns: string[];
}

/**
 * Query SDK usage statistics from PostHog
 *
 * Queries the pre-computed sdk_usage_monthly materialized view for fast results.
 */
export async function querySDKUsage(
   params: SDKQueryUsageParams,
): Promise<SDKUsageStats> {
   const { organizationId, startDate, endDate } = params;

   // Query the materialized view for fast results
   const query = `
      SELECT
         total_requests,
         author_requests,
         list_requests,
         content_requests,
         image_requests,
         author_found,
         content_found,
         avg_latency_ms,
         max_latency_ms,
         error_count,
         auth_failed_count
      FROM sdk_usage_monthly
      WHERE organization_id = '${organizationId}'
        AND month = toStartOfMonth(toDateTime('${startDate.toISOString()}'))
   `;

   const response = await fetch(
      `${env.POSTHOG_HOST}/api/projects/${env.POSTHOG_PROJECT_ID}/query`,
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
      throw new Error(`PostHog query failed: ${response.statusText}`);
   }

   const data = (await response.json()) as PostHogQueryResponse;
   const row = data.results[0] || [];

   // Map column indices to values
   const getValue = (index: number, defaultValue = 0) =>
      typeof row[index] === "number" ? (row[index] as number) : defaultValue;

   const totalRequests = getValue(0);
   const authorRequests = getValue(1);
   const listRequests = getValue(2);
   const contentRequests = getValue(3);
   const imageRequests = getValue(4);
   const authorFound = getValue(5);
   const contentFound = getValue(6);
   const avgLatencyMs = getValue(7);
   const maxLatencyMs = getValue(8);
   const errorCount = getValue(9);
   const authFailedCount = getValue(10);

   return {
      period: `${startDate.toISOString().split("T")[0]} - ${endDate.toISOString().split("T")[0]}`,
      totalRequests,
      byEndpoint: {
         author: authorRequests,
         list: listRequests,
         content: contentRequests,
         image: imageRequests,
      },
      successRates: {
         author: authorRequests > 0 ? (authorFound / authorRequests) * 100 : 0,
         content:
            contentRequests > 0 ? (contentFound / contentRequests) * 100 : 0,
      },
      performance: {
         avgLatencyMs,
         maxLatencyMs,
      },
      errors: {
         total: errorCount,
         authFailed: authFailedCount,
      },
   };
}

/**
 * Query SDK usage statistics grouped by month
 *
 * Queries the pre-computed sdk_usage_monthly materialized view for fast results.
 * Returns an array of monthly statistics for trend analysis.
 */
export async function querySDKUsageByMonth(
   params: SDKQueryUsageParams,
): Promise<SDKUsageStats[]> {
   const { organizationId, startDate, endDate } = params;

   // Query the materialized view for fast results
   const query = `
      SELECT
         month,
         total_requests,
         author_requests,
         list_requests,
         content_requests,
         image_requests,
         author_found,
         content_found,
         avg_latency_ms,
         max_latency_ms,
         error_count,
         auth_failed_count
      FROM sdk_usage_monthly
      WHERE organization_id = '${organizationId}'
        AND month >= toStartOfMonth(toDateTime('${startDate.toISOString()}'))
        AND month <= toStartOfMonth(toDateTime('${endDate.toISOString()}'))
      ORDER BY month ASC
   `;

   const response = await fetch(
      `${env.POSTHOG_HOST}/api/projects/${env.POSTHOG_PROJECT_ID}/query`,
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
      throw new Error(`PostHog query failed: ${response.statusText}`);
   }

   const data = (await response.json()) as PostHogQueryResponse;

   return data.results.map((row) => {
      const getValue = (index: number, defaultValue = 0) =>
         typeof row[index] === "number" ? (row[index] as number) : defaultValue;

      const month = row[0] as string;
      const totalRequests = getValue(1);
      const authorRequests = getValue(2);
      const listRequests = getValue(3);
      const contentRequests = getValue(4);
      const imageRequests = getValue(5);
      const authorFound = getValue(6);
      const contentFound = getValue(7);
      const avgLatencyMs = getValue(8);
      const maxLatencyMs = getValue(9);
      const errorCount = getValue(10);
      const authFailedCount = getValue(11);

      return {
         period: month,
         totalRequests,
         byEndpoint: {
            author: authorRequests,
            list: listRequests,
            content: contentRequests,
            image: imageRequests,
         },
         successRates: {
            author:
               authorRequests > 0 ? (authorFound / authorRequests) * 100 : 0,
            content:
               contentRequests > 0 ? (contentFound / contentRequests) * 100 : 0,
         },
         performance: {
            avgLatencyMs,
            maxLatencyMs,
         },
         errors: {
            total: errorCount,
            authFailed: authFailedCount,
         },
      };
   });
}
