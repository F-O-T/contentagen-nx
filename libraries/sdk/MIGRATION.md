# Migration Guide: v1.x to v2.0

This guide will help you migrate from `@contentta/sdk` v1.x (class-based API) to v2.0 (oRPC-based API).

## Table of Contents

- [Overview](#overview)
- [Breaking Changes](#breaking-changes)
- [Installation](#installation)
- [Migration Steps](#migration-steps)
  - [Step 1: Update SDK Initialization](#step-1-update-sdk-initialization)
  - [Step 2: Migrate Content Methods](#step-2-migrate-content-methods)
  - [Step 3: Migrate Event Tracking](#step-3-migrate-event-tracking)
  - [Step 4: Migrate Forms Integration](#step-4-migrate-forms-integration)
  - [Step 5: Update Browser SDK Usage](#step-5-update-browser-sdk-usage)
- [API Changes Reference](#api-changes-reference)
- [Common Migration Patterns](#common-migration-patterns)
- [Troubleshooting](#troubleshooting)

---

## Overview

Version 2.0 of the Contentta SDK introduces a new architecture based on [oRPC](https://orpc.dev), providing:

- **Type-safe RPC calls** with full TypeScript support
- **Modular API structure** with organized namespaces (`content`, `events`, `forms`)
- **Improved error handling** with structured error types
- **Better developer experience** with consistent patterns

The migration primarily involves updating method calls from the old class-based API to the new oRPC-based API.

---

## Breaking Changes

### API Structure

**v1.x** used a flat class-based API:
```typescript
sdk.listContentByAgent()
sdk.getContentBySlug()
sdk.getRelatedSlugs()
sdk.getAuthorByAgentId()
sdk.getContentImage()
```

**v2.0** uses namespaced oRPC procedures:
```typescript
sdk.content.list()
sdk.content.get()
sdk.content.getRelatedSlugs()
sdk.content.getAuthor()
sdk.content.getImage()
sdk.events.track()
sdk.events.batch()
sdk.forms.get()
sdk.forms.submit()
```

### Configuration Changes

- **v1.x**: Configuration included `locale` option
- **v2.0**: Removed `locale` option from SDK config (API now handles locale internally)

### Parameter Changes

- **Content endpoints**: Parameter names remain similar but are now passed through oRPC
- **Event tracking**: New batch endpoint for efficient event submission
- **Forms**: Enhanced validation and error handling

---

## Installation

Update your package.json to use v2.0:

```bash
npm install @contentta/sdk@2.0.0
```

or

```bash
yarn add @contentta/sdk@2.0.0
```

or

```bash
bun add @contentta/sdk@2.0.0
```

---

## Migration Steps

### Step 1: Update SDK Initialization

#### v1.x (Old)

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({
  apiKey: "your-api-key",
  locale: "en-US",  // ❌ No longer supported
  host: "https://custom.api.example.com",
});
```

#### v2.0 (New)

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({
  apiKey: "your-api-key",
  host: "https://custom.api.example.com",  // Optional, defaults to production
});
```

**Changes:**
- Removed `locale` parameter (API handles locale automatically)
- `host` parameter remains optional and works the same way

---

### Step 2: Migrate Content Methods

#### List Content by Agent

##### v1.x (Old)

```typescript
const { posts, total } = await sdk.listContentByAgent({
  agentId: "agent-uuid",
  status: ["approved", "draft"],
  limit: 10,
  page: 1,
});

for (const post of posts) {
  console.log(post.meta.title);
}
```

##### v2.0 (New)

```typescript
const { posts, total } = await sdk.content.list({
  agentId: "agent-uuid",
  status: ["approved", "draft"],
  limit: "10",  // ✅ Now accepts string
  page: "1",    // ✅ Now accepts string
});

for (const post of posts) {
  console.log(post.meta.title);
}
```

**Changes:**
- `sdk.listContentByAgent()` → `sdk.content.list()`
- `limit` and `page` now accept strings (automatically coerced to numbers)

---

#### Get Content by Slug

##### v1.x (Old)

```typescript
const content = await sdk.getContentBySlug({
  slug: "my-post-slug",
  agentId: "agent-uuid",
});

console.log(content.meta.title);
console.log(content.body);
```

##### v2.0 (New)

```typescript
const content = await sdk.content.get({
  slug: "my-post-slug",
  agentId: "agent-uuid",
});

console.log(content.meta.title);
console.log(content.body);
```

**Changes:**
- `sdk.getContentBySlug()` → `sdk.content.get()`
- Parameters and response structure remain the same

---

#### Get Related Slugs

##### v1.x (Old)

```typescript
const relatedSlugs = await sdk.getRelatedSlugs({
  slug: "my-post-slug",
  agentId: "agent-uuid",
});

console.log(relatedSlugs); // ["slug-1", "slug-2", ...]
```

##### v2.0 (New)

```typescript
const relatedSlugs = await sdk.content.getRelatedSlugs({
  slug: "my-post-slug",
  agentId: "agent-uuid",
});

console.log(relatedSlugs); // ["slug-1", "slug-2", ...]
```

**Changes:**
- `sdk.getRelatedSlugs()` → `sdk.content.getRelatedSlugs()`
- Response structure remains the same

---

#### Get Author by Agent ID

##### v1.x (Old)

```typescript
const author = await sdk.getAuthorByAgentId({
  agentId: "agent-uuid",
});

console.log(author.name);
console.log(author.profilePhoto?.data); // base64 image data
```

##### v2.0 (New)

```typescript
const author = await sdk.content.getAuthor({
  agentId: "agent-uuid",
});

console.log(author.name);
console.log(author.profilePhoto?.data); // base64 image data
```

**Changes:**
- `sdk.getAuthorByAgentId()` → `sdk.content.getAuthor()`
- Response structure remains the same

---

#### Get Content Image

##### v1.x (Old)

```typescript
const image = await sdk.getContentImage({
  contentId: "content-uuid",
});

if (image) {
  console.log(image.contentType); // "image/jpeg"
  console.log(image.data); // base64 image data
}
```

##### v2.0 (New)

```typescript
const image = await sdk.content.getImage({
  contentId: "content-uuid",
});

if (image) {
  console.log(image.contentType); // "image/jpeg"
  console.log(image.data); // base64 image data
}
```

**Changes:**
- `sdk.getContentImage()` → `sdk.content.getImage()`
- Response structure remains the same

---

### Step 3: Migrate Event Tracking

Event tracking in v2.0 is primarily handled through the browser SDK and event tracker client, but you can also use the core SDK for server-side event tracking.

#### Server-Side Event Tracking (New in v2.0)

##### v2.0

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({ apiKey: "your-api-key" });

// Track a single event
await sdk.events.track({
  eventName: "content.page.view",
  properties: {
    contentId: "content-uuid",
    contentSlug: "my-post",
    pageUrl: "https://example.com/blog/my-post",
  },
});

// Track multiple events in a batch (more efficient)
await sdk.events.batch({
  events: [
    {
      eventName: "content.page.view",
      properties: { contentId: "uuid-1", contentSlug: "post-1" },
      timestamp: Date.now(),
    },
    {
      eventName: "content.scroll.milestone",
      properties: { contentId: "uuid-1", depth: 50 },
      timestamp: Date.now(),
    },
  ],
});
```

**New Features:**
- `sdk.events.track()` for single event tracking
- `sdk.events.batch()` for efficient batch event submission
- Full TypeScript support for event properties

---

#### Client-Side Event Tracking

For browser environments, use the dedicated event tracker from `@contentta/sdk/browser`:

##### v2.0

```typescript
import { createEventTracker } from "@contentta/sdk/browser";

const tracker = createEventTracker({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
  batchSize: 10,
  flushInterval: 30000,
  debug: true,
});

// Track custom events
tracker.track("custom_event", {
  property1: "value1",
  property2: "value2",
});

// Auto-track page views with scroll, time, and CTA tracking
tracker.autoTrackPageViews("content-uuid", "content-slug");

// Clean up when done
tracker.destroy();
```

**New Features:**
- Automatic batching and retry logic
- Built-in scroll depth tracking
- Time-on-page tracking
- CTA click tracking
- Respects Do Not Track and Global Privacy Control

---

### Step 4: Migrate Forms Integration

Forms integration has been completely redesigned in v2.0 with better validation and error handling.

#### Get Form Definition

##### v1.x

```typescript
// Not available in v1.x
```

##### v2.0 (New)

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({ apiKey: "your-api-key" });

const form = await sdk.forms.get({
  formId: "form-uuid",
});

console.log(form.name);
console.log(form.fields);
```

---

#### Submit Form Data

##### v1.x

```typescript
// Not available in v1.x
```

##### v2.0 (New)

```typescript
const result = await sdk.forms.submit({
  formId: "form-uuid",
  data: {
    email: "user@example.com",
    name: "John Doe",
    message: "Hello!",
  },
});

console.log(result.success);
console.log(result.submissionId);
```

---

#### Embed Form (Browser)

##### v2.0 (New)

```typescript
import { createBrowserSdk } from "@contentta/sdk/browser";

const sdk = createBrowserSdk({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
});

// Embed form into a container
await sdk.forms.embedForm("form-uuid", "form-container-id");
```

**New Features:**
- Automatic form rendering with pre-styled components
- Built-in validation and error handling
- Success message and redirect support
- Automatic event tracking for impressions and submissions

---

### Step 5: Update Browser SDK Usage

The browser SDK now provides a unified interface for both event tracking and forms.

#### v2.0 Browser SDK

```typescript
import { createBrowserSdk } from "@contentta/sdk/browser";

const sdk = createBrowserSdk({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
  batchSize: 10,
  flushInterval: 30000,
  debug: true,
  enableAnalytics: true,
});

// Event tracking
sdk.tracker.track("page_view", { page: "/blog" });
sdk.tracker.autoTrackPageViews("content-id", "content-slug");

// Forms
await sdk.forms.embedForm("form-id", "container-id");

// Clean up
sdk.tracker.destroy();
```

**New Features:**
- Unified `createBrowserSdk()` factory
- Access both `tracker` and `forms` from a single instance
- Consistent configuration across features

---

## API Changes Reference

### Content Methods

| v1.x | v2.0 | Notes |
|------|------|-------|
| `listContentByAgent()` | `content.list()` | `limit` and `page` now accept strings |
| `getContentBySlug()` | `content.get()` | No changes to parameters |
| `getRelatedSlugs()` | `content.getRelatedSlugs()` | No changes to parameters |
| `getAuthorByAgentId()` | `content.getAuthor()` | No changes to parameters |
| `getContentImage()` | `content.getImage()` | No changes to parameters |

### Event Methods

| v1.x | v2.0 | Notes |
|------|------|-------|
| N/A | `events.track()` | New in v2.0 |
| N/A | `events.batch()` | New in v2.0 |

### Forms Methods

| v1.x | v2.0 | Notes |
|------|------|-------|
| N/A | `forms.get()` | New in v2.0 |
| N/A | `forms.submit()` | New in v2.0 |

### Browser SDK

| v1.x | v2.0 | Notes |
|------|------|-------|
| N/A | `createBrowserSdk()` | New unified browser SDK |
| N/A | `createEventTracker()` | Standalone event tracker |
| N/A | `createFormsClient()` | Standalone forms client |

---

## Common Migration Patterns

### Pattern 1: Blog Post Listing Page

#### v1.x

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({
  apiKey: process.env.CONTENTTA_API_KEY!,
  locale: "en-US",
});

async function getBlogPosts(page = 1) {
  const { posts, total } = await sdk.listContentByAgent({
    agentId: process.env.AGENT_ID!,
    status: "approved",
    limit: 12,
    page,
  });

  return { posts, total, pages: Math.ceil(total / 12) };
}
```

#### v2.0

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({
  apiKey: process.env.CONTENTTA_API_KEY!,
});

async function getBlogPosts(page = 1) {
  const { posts, total } = await sdk.content.list({
    agentId: process.env.AGENT_ID!,
    status: "approved",
    limit: "12",
    page: String(page),
  });

  return { posts, total, pages: Math.ceil(total / 12) };
}
```

---

### Pattern 2: Single Blog Post Page

#### v1.x

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({
  apiKey: process.env.CONTENTTA_API_KEY!,
});

async function getBlogPost(slug: string) {
  const content = await sdk.getContentBySlug({
    slug,
    agentId: process.env.AGENT_ID!,
  });

  const relatedSlugs = await sdk.getRelatedSlugs({
    slug,
    agentId: process.env.AGENT_ID!,
  });

  const author = await sdk.getAuthorByAgentId({
    agentId: process.env.AGENT_ID!,
  });

  return { content, relatedSlugs, author };
}
```

#### v2.0

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({
  apiKey: process.env.CONTENTTA_API_KEY!,
});

async function getBlogPost(slug: string) {
  const content = await sdk.content.get({
    slug,
    agentId: process.env.AGENT_ID!,
  });

  const relatedSlugs = await sdk.content.getRelatedSlugs({
    slug,
    agentId: process.env.AGENT_ID!,
  });

  const author = await sdk.content.getAuthor({
    agentId: process.env.AGENT_ID!,
  });

  return { content, relatedSlugs, author };
}
```

---

### Pattern 3: Blog Post with Analytics (Browser)

#### v2.0

```typescript
import { createBrowserSdk } from "@contentta/sdk/browser";

const sdk = createBrowserSdk({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
  debug: import.meta.env.DEV,
});

// Initialize on page load
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

---

### Pattern 4: Form Integration (Browser)

#### v2.0

```typescript
import { createBrowserSdk } from "@contentta/sdk/browser";

const sdk = createBrowserSdk({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
});

// Embed form on page load
document.addEventListener("DOMContentLoaded", async () => {
  await sdk.forms.embedForm("form-uuid", "contact-form-container");
});
```

---

## Troubleshooting

### Issue: "locale is not a valid option"

**Error:**
```
TypeScript error: Object literal may only specify known properties, and 'locale' does not exist in type 'SdkConfig'.
```

**Solution:**
Remove the `locale` parameter from your SDK configuration. The API now handles locale automatically based on request headers.

```typescript
// ❌ Old
const sdk = createSdk({ apiKey: "...", locale: "en-US" });

// ✅ New
const sdk = createSdk({ apiKey: "..." });
```

---

### Issue: "Method does not exist on sdk"

**Error:**
```
Property 'listContentByAgent' does not exist on type 'Client<...>'.
```

**Solution:**
Update your method calls to use the new namespaced API:

```typescript
// ❌ Old
await sdk.listContentByAgent({ ... });

// ✅ New
await sdk.content.list({ ... });
```

---

### Issue: "Type 'number' is not assignable to type 'string'"

**Error:**
```
Type 'number' is not assignable to type 'string' for parameters 'limit' or 'page'.
```

**Solution:**
The v2.0 API accepts strings for `limit` and `page` parameters (they're automatically coerced):

```typescript
// ❌ Old
await sdk.content.list({ limit: 10, page: 1 });

// ✅ New
await sdk.content.list({ limit: "10", page: "1" });
```

---

### Issue: Events not being tracked

**Problem:**
Events are not appearing in your analytics dashboard.

**Solution:**
1. Ensure you're using the correct `organizationId` in your configuration
2. Check that `enableAnalytics` is not set to `false`
3. Verify that Do Not Track is not enabled in your browser
4. Call `tracker.flush()` to immediately send pending events (useful for debugging)

```typescript
// Debug event tracking
const tracker = createEventTracker({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
  debug: true, // Enable console logging
});

tracker.track("test_event", { test: true });
await tracker.flush(); // Force immediate send
```

---

### Issue: Form validation errors

**Problem:**
Form submission fails with validation errors.

**Solution:**
The v2.0 forms API provides detailed validation errors in the response:

```typescript
try {
  await sdk.forms.submit({
    formId: "form-uuid",
    data: { email: "invalid-email" },
  });
} catch (error) {
  if (error?.cause?.errors) {
    // Field-specific errors
    console.log(error.cause.errors);
    // { email: "Invalid email format" }
  }
}
```

---

### Issue: TypeScript errors with event properties

**Problem:**
TypeScript complains about event property types.

**Solution:**
Event properties should be `Record<string, unknown>`:

```typescript
// ✅ Correct
tracker.track("page_view", {
  page: "/blog",
  timestamp: Date.now(),
  metadata: { source: "organic" },
});

// Type-safe with explicit typing
interface PageViewProperties {
  page: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

const props: PageViewProperties = {
  page: "/blog",
  timestamp: Date.now(),
};

tracker.track("page_view", props);
```

---

### Need More Help?

If you encounter issues not covered in this guide:

1. Check the [API documentation](https://github.com/F-O-T/contentta-nx/blob/master/libraries/sdk/README.md)
2. Review the [CHANGELOG](https://github.com/F-O-T/contentta-nx/blob/master/libraries/sdk/CHANGELOG.md)
3. Open an issue on [GitHub](https://github.com/F-O-T/contentta-nx/issues)
4. Join our community Discord server

---

## Summary

The v2.0 SDK provides a more structured, type-safe, and feature-rich API for interacting with Contentta. The migration primarily involves:

1. Removing `locale` from SDK configuration
2. Updating method calls to use namespaced API (`content.*`, `events.*`, `forms.*`)
3. Converting numeric parameters to strings where needed
4. Adopting the new browser SDK for client-side features

Most applications can complete the migration in under an hour by following the patterns in this guide.
