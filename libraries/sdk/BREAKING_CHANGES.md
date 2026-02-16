# Breaking Changes - v2.0.0

This document outlines all breaking changes introduced in version 2.0.0 of the Contentta SDK. This is a complete rewrite from the previous class-based SDK to a functional, type-safe oRPC client.

## Overview

Version 2.0.0 represents a fundamental architectural shift:
- From class-based to functional API
- From REST-style methods to oRPC procedures
- From manual request handling to type-safe client generation
- From scattered exports to organized entry points

## Migration Guide

### 1. Package Name Change

**Old:**
```bash
npm install @f-o-t/contentagen-sdk
# or
npm install @contentagen/sdk
```

**New:**
```bash
npm install @contentta/sdk
```

**Action Required:**
1. Uninstall the old package: `npm uninstall @f-o-t/contentagen-sdk` or `npm uninstall @contentagen/sdk`
2. Install the new package: `npm install @contentta/sdk`
3. Update all import statements from `@f-o-t/contentagen-sdk` or `@contentagen/sdk` to `@contentta/sdk`

---

### 2. API Surface: Class-Based → Functional

**Old:**
```typescript
import { ContentaGenSDK } from "@contentagen/sdk";

const sdk = new ContentaGenSDK({
  apiKey: "your-api-key",
  locale: "en-US",
  host: "https://custom.api.example.com",
});
```

**New:**
```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({
  apiKey: "your-api-key",
  host: "https://custom.api.example.com",
});
```

**Changes:**
- Constructor `new ContentaGenSDK()` → Factory function `createSdk()`
- `locale` configuration removed (now handled server-side via user preferences)
- `host` configuration remains the same

---

### 3. Method Names: REST-Style → oRPC Procedures

All methods have been reorganized into namespaced procedures following oRPC conventions.

#### Content Methods

**Old:**
```typescript
// List content
const { posts, total } = await sdk.listContentByAgent({
  agentId: "agent-uuid",
  status: ["approved", "draft"],
  limit: 10,
  page: 1,
});

// Get by slug
const post = await sdk.getContentBySlug({
  slug: "my-post-slug",
  agentId: "agent-uuid",
});

// Get related slugs
const relatedSlugs = await sdk.getRelatedSlugs({
  slug: "my-post-slug",
  agentId: "agent-uuid",
});

// Get author
const author = await sdk.getAuthorByAgentId({
  agentId: "agent-uuid",
});

// Get content image
const image = await sdk.getContentImage({
  contentId: "content-uuid",
});
```

**New:**
```typescript
// List content
const { posts, total } = await sdk.content.list({
  agentId: "agent-uuid",
  limit: "10",
  page: "1",
});

// Get by slug
const post = await sdk.content.get({
  agentId: "agent-uuid",
  slug: "my-post-slug",
});

// Get related slugs
const relatedSlugs = await sdk.content.getRelatedSlugs({
  agentId: "agent-uuid",
  slug: "my-post-slug",
});

// Get author
const author = await sdk.content.getAuthor({
  agentId: "agent-uuid",
});

// Get analytics (includes image data)
const analytics = await sdk.content.getAnalytics({
  contentId: "content-uuid",
});
```

**Changes:**
- `listContentByAgent()` → `sdk.content.list()`
- `getContentBySlug()` → `sdk.content.get()`
- `getRelatedSlugs()` → `sdk.content.getRelatedSlugs()`
- `getAuthorByAgentId()` → `sdk.content.getAuthor()`
- `getContentImage()` → `sdk.content.getAnalytics()` (image now part of analytics response)
- Parameters are now strings instead of numbers for `limit` and `page`
- Parameter order changed: `agentId` now comes first consistently

---

### 4. Import Paths: Events & Forms

Browser-specific functionality (events and forms) has been consolidated into a single entry point.

#### Events

**Old:**
```typescript
import { createEventTracker } from "@contentagen/sdk/events";

const tracker = createEventTracker({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
});

tracker.track("page_view", { page: "/blog" });
```

**New:**
```typescript
import { createEventTracker } from "@contentta/sdk/browser";

const tracker = createEventTracker({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
});

tracker.track("page_view", { page: "/blog" });
```

**Changes:**
- Import path changed: `@contentagen/sdk/events` → `@contentta/sdk/browser`
- API remains the same

#### Forms

**Old:**
```typescript
import { createFormsClient } from "@contentagen/sdk/forms";

const forms = createFormsClient({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
});

await forms.embedForm("form-id", "container-id");
```

**New:**
```typescript
import { createFormsClient } from "@contentta/sdk/browser";

const forms = createFormsClient({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
});

await forms.embedForm("form-id", "container-id");
```

**Changes:**
- Import path changed: `@contentagen/sdk/forms` → `@contentta/sdk/browser`
- API remains the same

#### Unified Browser SDK

**New in v2.0.0:**
```typescript
import { createBrowserSdk } from "@contentta/sdk/browser";

const sdk = createBrowserSdk({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
});

// Both tracker and forms available
sdk.tracker.track("page_view", { page: "/blog" });
await sdk.forms.embedForm("form-id", "container-id");
```

This unified approach is recommended for browser environments where you need both event tracking and form handling.

---

### 5. Analytics Integration

**Old:**
```typescript
// Get content with separate analytics call
const post = await sdk.getContentBySlug({
  slug: "my-post",
  agentId: "agent-uuid",
});

// Analytics not available through SDK
```

**New:**
```typescript
// Get content
const post = await sdk.content.get({
  agentId: "agent-uuid",
  slug: "my-post",
});

// Get content with analytics
const withAnalytics = await sdk.content.getAnalytics({
  contentId: post.id,
});

// Access analytics data
console.log(withAnalytics.analytics);
console.log(withAnalytics.image);
```

**Changes:**
- New `sdk.content.getAnalytics()` method provides analytics data alongside content
- Image data now available through analytics endpoint

---

### 6. Error Handling

**Old:**
```typescript
try {
  const sdk = new ContentaGenSDK({ apiKey: "" });
} catch (err) {
  // Error codes: SDK_E001, SDK_E002, SDK_E003, SDK_E004
}
```

**New:**
```typescript
try {
  const sdk = createSdk({ apiKey: "" });
} catch (err) {
  // Standard Error with message
  // oRPC client handles API errors with proper typing
}
```

**Changes:**
- Custom error codes removed
- Standard JavaScript errors used
- oRPC client provides typed error responses

---

### 7. TypeScript Types

**Old:**
```typescript
import {
  ContentaGenSDK,
  ShareStatus,
  ContentListResponseSchema,
  ContentSelectSchema,
} from "@contentagen/sdk";
```

**New:**
```typescript
import {
  createSdk,
  ShareStatus,
  ContentList,
  ContentSelect,
  ContentListResponseSchema,
  ContentSelectSchema,
} from "@contentta/sdk";
```

**Changes:**
- `ContentaGenSDK` class no longer exported (use `createSdk` return type)
- All Zod schemas still available for validation
- TypeScript types extracted from schemas for better IDE support

---

### 8. PostHog Analytics Helper

**Old:**
```typescript
import { createPostHogHelper } from "@contentagen/sdk/posthog";

const helper = createPostHogHelper();
const script = helper.trackBlogPostView({
  id: "post-id",
  slug: "post-slug",
  title: "Post Title",
  agentId: "agent-uuid",
});
```

**New:**
```typescript
import { createPostHogHelper } from "@contentta/sdk/posthog";

const helper = createPostHogHelper();
const script = helper.trackBlogPostView({
  id: "post-id",
  slug: "post-slug",
  title: "Post Title",
  agentId: "agent-uuid",
});
```

**Changes:**
- Import path updated to new package name
- API remains the same

---

## Complete Migration Example

### Before (v1.x):

```typescript
import { ContentaGenSDK } from "@contentagen/sdk";
import { createEventTracker } from "@contentagen/sdk/events";
import { createFormsClient } from "@contentagen/sdk/forms";

const sdk = new ContentaGenSDK({
  apiKey: "your-api-key",
  locale: "en-US",
});

const tracker = createEventTracker({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
});

const forms = createFormsClient({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
});

async function example() {
  // List content
  const { posts, total } = await sdk.listContentByAgent({
    agentId: "agent-uuid",
    status: "approved",
    limit: 10,
    page: 1,
  });

  // Get content
  const post = await sdk.getContentBySlug({
    slug: posts[0].meta.slug!,
    agentId: "agent-uuid",
  });

  // Track event
  tracker.track("page_view", { page: "/blog" });

  // Embed form
  await forms.embedForm("form-id", "container-id");
}
```

### After (v2.0.0):

```typescript
import { createSdk } from "@contentta/sdk";
import { createBrowserSdk } from "@contentta/sdk/browser";

const sdk = createSdk({
  apiKey: "your-api-key",
});

const browser = createBrowserSdk({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
});

async function example() {
  // List content
  const { posts, total } = await sdk.content.list({
    agentId: "agent-uuid",
    limit: "10",
    page: "1",
  });

  // Get content
  const post = await sdk.content.get({
    agentId: "agent-uuid",
    slug: posts[0].meta.slug!,
  });

  // Track event
  browser.tracker.track("page_view", { page: "/blog" });

  // Embed form
  await browser.forms.embedForm("form-id", "container-id");
}
```

---

## Summary of Breaking Changes

| Category | Old | New |
|----------|-----|-----|
| Package Name | `@f-o-t/contentagen-sdk` or `@contentagen/sdk` | `@contentta/sdk` |
| API Style | Class-based (`new ContentaGenSDK()`) | Functional (`createSdk()`) |
| Content List | `sdk.listContentByAgent()` | `sdk.content.list()` |
| Content Get | `sdk.getContentBySlug()` | `sdk.content.get()` |
| Related Slugs | `sdk.getRelatedSlugs()` | `sdk.content.getRelatedSlugs()` |
| Author | `sdk.getAuthorByAgentId()` | `sdk.content.getAuthor()` |
| Image | `sdk.getContentImage()` | `sdk.content.getAnalytics()` |
| Events Import | `@contentagen/sdk/events` | `@contentta/sdk/browser` |
| Forms Import | `@contentagen/sdk/forms` | `@contentta/sdk/browser` |
| Locale Config | Constructor option | Removed (server-side) |
| Parameter Types | Numbers (`limit: 10`) | Strings (`limit: "10"`) |

---

## Need Help?

If you encounter issues during migration:

1. Check the [README.md](./README.md) for updated API documentation
2. Review the [CHANGELOG.md](./CHANGELOG.md) for version history
3. Open an issue at [GitHub Issues](https://github.com/F-O-T/contentta-nx/issues)

---

## Deprecation Timeline

- **v1.x**: Deprecated as of v2.0.0 release
- **Support**: Critical bug fixes only
- **Recommendation**: Migrate to v2.0.0 immediately for new features and improvements
