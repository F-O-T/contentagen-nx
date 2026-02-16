# Contentta SDK v2.0.0 Release Notes

We're excited to announce the release of Contentta SDK v2.0.0, a complete rewrite of our TypeScript SDK with a modern oRPC-based architecture!

## What's New

### Type-Safe oRPC Architecture

v2.0.0 introduces a completely new architecture built on [oRPC](https://orpc.dev), providing:

- **Full Type Safety**: End-to-end TypeScript support with type inference
- **Modular API**: Organized namespaces (`content`, `events`, `forms`) for better code organization
- **Automatic Validation**: Input validation with Zod schemas
- **Better Errors**: Structured error handling with detailed error types

### Unified Browser SDK

New unified browser SDK consolidates event tracking and forms:

```typescript
import { createBrowserSdk } from "@contentta/sdk/browser";

const sdk = createBrowserSdk({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
});

// Event tracking
sdk.tracker.track("page_view", { page: "/blog" });
sdk.tracker.autoTrackPageViews("content-id", "content-slug");

// Forms
await sdk.forms.embedForm("form-id", "container-id");
```

### Server-Side Event Tracking

New server-side event tracking capabilities:

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({ apiKey: "your-api-key" });

// Track single event
await sdk.events.track({
  eventName: "content.published",
  properties: { contentId: "uuid" },
});

// Batch multiple events (more efficient)
await sdk.events.batch({
  events: [
    { eventName: "content.created", properties: {...}, timestamp: Date.now() },
    { eventName: "content.approved", properties: {...}, timestamp: Date.now() },
  ],
});
```

### Enhanced Forms Integration

New forms API for both server and browser:

```typescript
// Get form definition
const form = await sdk.forms.get({ formId: "form-uuid" });

// Submit form data
const result = await sdk.forms.submit({
  formId: "form-uuid",
  data: { email: "user@example.com", name: "John Doe" },
});

// Browser: Embed form with automatic rendering
await sdk.forms.embedForm("form-uuid", "container-id");
```

### Analytics Integration

New analytics endpoint combines content and metrics:

```typescript
const analytics = await sdk.content.getAnalytics({
  contentId: "content-uuid",
});

console.log(analytics.analytics); // View counts, engagement metrics
console.log(analytics.image); // Image data
```

## Breaking Changes

This is a major version with significant breaking changes. Please see our comprehensive migration guide:

- [BREAKING_CHANGES.md](./BREAKING_CHANGES.md) - Complete list of breaking changes
- [MIGRATION.md](./MIGRATION.md) - Step-by-step migration guide

### Quick Migration Summary

1. **Package Name**: `@contentagen/sdk` → `@contentta/sdk`
2. **API Style**: Class-based → Functional
3. **Method Names**: Flat → Namespaced

```typescript
// Old (v1.x)
import { ContentaGenSDK } from "@contentagen/sdk";
const sdk = new ContentaGenSDK({ apiKey: "...", locale: "en-US" });
const { posts } = await sdk.listContentByAgent({ agentId, limit: 10 });

// New (v2.0)
import { createSdk } from "@contentta/sdk";
const sdk = createSdk({ apiKey: "..." });
const { posts } = await sdk.content.list({ agentId, limit: "10" });
```

### Browser SDK Migration

```typescript
// Old (v1.x)
import { createEventTracker } from "@contentagen/sdk/events";
import { createFormsClient } from "@contentagen/sdk/forms";

// New (v2.0)
import { createBrowserSdk } from "@contentta/sdk/browser";
// Or separate imports if needed:
import { createEventTracker, createFormsClient } from "@contentta/sdk/browser";
```

## Complete API Changes

### Content Methods

| v1.x | v2.0 |
|------|------|
| `listContentByAgent()` | `sdk.content.list()` |
| `getContentBySlug()` | `sdk.content.get()` |
| `getRelatedSlugs()` | `sdk.content.getRelatedSlugs()` |
| `getAuthorByAgentId()` | `sdk.content.getAuthor()` |
| `getContentImage()` | `sdk.content.getImage()` |
| N/A | `sdk.content.getAnalytics()` (NEW) |

### Event Methods (NEW in v2.0)

| Method | Description |
|--------|-------------|
| `sdk.events.track()` | Track single event |
| `sdk.events.batch()` | Track multiple events efficiently |

### Forms Methods (NEW in v2.0)

| Method | Description |
|--------|-------------|
| `sdk.forms.get()` | Get form definition |
| `sdk.forms.submit()` | Submit form data |

### Browser SDK (NEW in v2.0)

| Feature | Description |
|---------|-------------|
| `createBrowserSdk()` | Unified browser SDK factory |
| `sdk.tracker.*` | Event tracking client |
| `sdk.forms.*` | Forms client |

## Installation

### New Installation

```bash
npm install @contentta/sdk
```

### Upgrading from v1.x

```bash
# Uninstall old package
npm uninstall @contentagen/sdk

# Install new package
npm install @contentta/sdk
```

## Migration Resources

We've created comprehensive documentation to help you migrate:

1. **[README.md](./README.md)** - Complete API reference with examples
2. **[MIGRATION.md](./MIGRATION.md)** - Step-by-step migration guide
3. **[BREAKING_CHANGES.md](./BREAKING_CHANGES.md)** - Detailed breaking changes list
4. **[CHANGELOG.md](./CHANGELOG.md)** - Full version history

## Examples

### Example 1: Blog Post Listing

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({
  apiKey: process.env.CONTENTTA_API_KEY!,
});

async function getBlogPosts(page = 1, pageSize = 12) {
  const { posts, total } = await sdk.content.list({
    agentId: process.env.AGENT_ID!,
    status: "approved",
    limit: String(pageSize),
    page: String(page),
  });

  return {
    posts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page < Math.ceil(total / pageSize),
      hasPrev: page > 1,
    },
  };
}
```

### Example 2: Blog Post Detail

```typescript
async function getBlogPostDetail(slug: string) {
  const agentId = process.env.AGENT_ID!;

  // Fetch post, related content, and author in parallel
  const [content, relatedSlugs, author] = await Promise.all([
    sdk.content.get({ slug, agentId }),
    sdk.content.getRelatedSlugs({ slug, agentId }),
    sdk.content.getAuthor({ agentId }),
  ]);

  return { content, relatedSlugs, author };
}
```

### Example 3: Browser Analytics

```typescript
import { createBrowserSdk } from "@contentta/sdk/browser";

const sdk = createBrowserSdk({
  apiKey: import.meta.env.VITE_CONTENTTA_API_KEY,
  organizationId: import.meta.env.VITE_CONTENTTA_ORG_ID,
  debug: import.meta.env.DEV,
});

// Initialize analytics on page load
document.addEventListener("DOMContentLoaded", () => {
  const contentId = document.querySelector("[data-content-id]")?.getAttribute("data-content-id");
  const contentSlug = document.querySelector("[data-content-slug]")?.getAttribute("data-content-slug");

  if (contentId && contentSlug) {
    // Auto-track page views, scroll depth, time on page, and CTA clicks
    sdk.tracker.autoTrackPageViews(contentId, contentSlug);
  }
});

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  sdk.tracker.destroy();
});
```

### Example 4: Server-Side Event Tracking

```typescript
// Track events from your backend
async function trackContentPublication(contentId: string) {
  await sdk.events.track({
    eventName: "content.published",
    properties: {
      contentId,
      publishedAt: Date.now(),
      publishedBy: "system",
    },
  });
}

// Batch track multiple events
async function trackBatchEvents(events: Array<{ eventName: string; properties: Record<string, unknown> }>) {
  await sdk.events.batch({
    events: events.map((event) => ({
      ...event,
      timestamp: Date.now(),
    })),
  });
}
```

### Example 5: Form Integration

```html
<!DOCTYPE html>
<html>
<head>
  <title>Contact Us</title>
</head>
<body>
  <h1>Contact Us</h1>
  <div id="contact-form"></div>

  <script type="module">
    import { createBrowserSdk } from "@contentta/sdk/browser";

    const sdk = createBrowserSdk({
      apiKey: "your-api-key",
      organizationId: "your-org-id",
    });

    // Embed form
    await sdk.forms.embedForm("form-uuid", "contact-form");
  </script>
</body>
</html>
```

## TypeScript Support

The v2.0 SDK provides comprehensive TypeScript support:

```typescript
import type {
  // Content types
  ContentList,
  ContentSelect,
  ContentMeta,
  ContentRequest,
  ContentStats,
  ContentStatus,
  ContentWithAnalytics,
  ShareStatus,
  Image,

  // Event types
  TrackedEvent,
  EventBatch,
  ContenttaSdkConfig,

  // Form types
  FormDefinition,
  FormField,

  // Analytics types
  AnalyticsResponse,
} from "@contentta/sdk";
```

All Zod schemas are also exported for runtime validation:

```typescript
import {
  ContentListResponseSchema,
  ContentSelectSchema,
  ContentMetaSchema,
  ContentRequestSchema,
  GetContentBySlugInputSchema,
  ListContentByAgentInputSchema,
  ImageSchema,
  AnalyticsResponseSchema,
} from "@contentta/sdk";
```

## Performance Improvements

- Smaller bundle size with modular architecture
- Efficient event batching reduces network requests
- oRPC provides faster serialization/deserialization
- Automatic retry logic for failed requests

## Backward Compatibility

v2.0 is not backward compatible with v1.x. However, we provide:

- Comprehensive migration documentation
- Side-by-side examples showing v1.x vs v2.0 code
- Common migration patterns for typical use cases

## Support

- **v1.x**: Critical bug fixes only, no new features
- **v2.x**: All new features and improvements

We strongly recommend migrating to v2.0 to take advantage of the improved architecture and new features.

## Getting Help

If you encounter issues during migration:

1. Check the [README.md](./README.md) for API documentation
2. Review the [MIGRATION.md](./MIGRATION.md) guide
3. Read the [BREAKING_CHANGES.md](./BREAKING_CHANGES.md) document
4. Open an issue on [GitHub](https://github.com/F-O-T/contentta-nx/issues)

## What's Next

We have exciting features planned for v2.x:

- Real-time content updates via WebSockets
- Advanced analytics with custom event types
- Enhanced form builder with conditional logic
- Server-side rendering optimizations
- GraphQL API support

Stay tuned for updates!

## Contributors

Thank you to everyone who contributed to this release!

## License

Apache License 2.0

---

**Full Changelog**: https://github.com/F-O-T/contentta-nx/blob/master/libraries/sdk/CHANGELOG.md
