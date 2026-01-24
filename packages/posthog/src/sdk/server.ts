import type { PostHog } from "posthog-node";

// ============================================================================
// SDK Event Types
// ============================================================================

export type SDKAuthorFetchedProps = {
   userId: string;
   organizationId?: string;
   agentId: string;
   found: boolean;
   latencyMs: number;
};

export type SDKContentListedProps = {
   userId: string;
   organizationId?: string;
   agentId: string;
   limit: number;
   page: number;
   status: string[];
   totalCount: number;
   latencyMs: number;
};

export type SDKContentFetchedProps = {
   userId: string;
   organizationId?: string;
   agentId: string;
   slug: string;
   found: boolean;
   latencyMs: number;
};

export type SDKImageFetchedProps = {
   userId: string;
   organizationId?: string;
   contentId: string;
   found: boolean;
   latencyMs: number;
};

export type SDKAuthFailedProps = {
   organizationId?: string;
   reason:
      | "missing_api_key"
      | "invalid_key"
      | "rate_limited"
      | "invalid_session"
      | "feature_not_enabled";
   plan?: string;
   endpoint: string;
   /** Milliseconds until rate limit resets (for rate_limited) */
   tryAgainIn?: number;
   /** Remaining requests (for rate limit info) */
   remaining?: number;
};

export type SDKErrorProps = {
   userId?: string;
   organizationId?: string;
   endpoint: string;
   errorCode: string;
   errorMessage: string;
};

// ============================================================================
// SDK Capture Functions
// ============================================================================

/**
 * Capture when an author/agent is fetched via SDK
 */
export function captureSDKAuthorFetched(
   posthog: PostHog,
   props: SDKAuthorFetchedProps,
) {
   const { userId, organizationId, agentId, found, latencyMs } = props;
   posthog.capture({
      distinctId: userId,
      event: "sdk_author_fetched",
      properties: {
         agentId,
         found,
         latencyMs,
      },
      groups: organizationId ? { organization: organizationId } : undefined,
   });
}

/**
 * Capture when content is listed via SDK
 */
export function captureSDKContentListed(
   posthog: PostHog,
   props: SDKContentListedProps,
) {
   const {
      userId,
      organizationId,
      agentId,
      limit,
      page,
      status,
      totalCount,
      latencyMs,
   } = props;
   posthog.capture({
      distinctId: userId,
      event: "sdk_content_listed",
      properties: {
         agentId,
         limit,
         page,
         status,
         totalCount,
         latencyMs,
      },
      groups: organizationId ? { organization: organizationId } : undefined,
   });
}

/**
 * Capture when specific content is fetched by slug via SDK
 */
export function captureSDKContentFetched(
   posthog: PostHog,
   props: SDKContentFetchedProps,
) {
   const { userId, organizationId, agentId, slug, found, latencyMs } = props;
   posthog.capture({
      distinctId: userId,
      event: "sdk_content_fetched",
      properties: {
         agentId,
         slug,
         found,
         latencyMs,
      },
      groups: organizationId ? { organization: organizationId } : undefined,
   });
}

/**
 * Capture when a content image is fetched via SDK
 */
export function captureSDKImageFetched(
   posthog: PostHog,
   props: SDKImageFetchedProps,
) {
   const { userId, organizationId, contentId, found, latencyMs } = props;
   posthog.capture({
      distinctId: userId,
      event: "sdk_image_fetched",
      properties: {
         contentId,
         found,
         latencyMs,
      },
      groups: organizationId ? { organization: organizationId } : undefined,
   });
}

/**
 * Capture when SDK authentication fails
 */
export function captureSDKAuthFailed(
   posthog: PostHog,
   props: SDKAuthFailedProps,
) {
   const { organizationId, reason, plan, endpoint } = props;
   // Use anonymous ID when auth fails
   const distinctId = organizationId ?? "anonymous_sdk_user";
   posthog.capture({
      distinctId,
      event: "sdk_auth_failed",
      properties: {
         reason,
         plan,
         endpoint,
      },
      groups: organizationId ? { organization: organizationId } : undefined,
   });
}

/**
 * Capture SDK errors
 */
export function captureSDKError(posthog: PostHog, props: SDKErrorProps) {
   const { userId, organizationId, endpoint, errorCode, errorMessage } = props;
   const distinctId = userId ?? organizationId ?? "anonymous_sdk_user";
   posthog.capture({
      distinctId,
      event: "sdk_error",
      properties: {
         endpoint,
         errorCode,
         errorMessage,
      },
      groups: organizationId ? { organization: organizationId } : undefined,
   });
}
