# Contentta SDK

Official TypeScript SDK for interacting with the Contentta API.

## Features
- Type-safe oRPC client with full TypeScript support
- Modular API structure with organized namespaces (`content`, `events`, `forms`)
- Input validation with Zod schemas and shared schema exports
- Automatic date parsing for `createdAt` / `updatedAt`
- Structured error handling with detailed error types
- Server-side and browser-side SDKs for different use cases
- Event tracking with automatic batching and retry logic
- Forms integration with automatic rendering and validation

## Installation

npm:
```bash
npm install @contentta/sdk
```

yarn:
```bash
yarn add @contentta/sdk
```

bun:
```bash
bun add @contentta/sdk
```

## Quick Start

### Server-Side Usage (Node.js, Bun, Deno)

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({
  apiKey: "YOUR_API_KEY",
  host: "https://custom.api.example.com", // Optional: custom API host
});

async function example() {
  const agentId = "00000000-0000-0000-0000-000000000000";

  // List content by agent
  const { posts, total } = await sdk.content.list({
    agentId,
    status: ["approved", "draft"],
    limit: "10",
    page: "1",
  });

  console.log(`Found ${total} posts`);
  console.log(posts[0].meta.title);

  // Get content by slug
  const content = await sdk.content.get({
    slug: "my-post-slug",
    agentId,
  });

  console.log(content.body);

  // Get related slugs for a post
  const relatedSlugs = await sdk.content.getRelatedSlugs({
    slug: "my-post-slug",
    agentId,
  });

  console.log(relatedSlugs);

  // Get author info by agent ID
  const author = await sdk.content.getAuthor({
    agentId,
  });

  console.log(author.name);
  console.log(author.profilePhoto?.data); // base64 image data

  // Get the image data for a specific content ID
  const image = await sdk.content.getImage({
    contentId: content.id,
  });

  console.log(image?.contentType);
  console.log(image?.data); // base64 image data

  // Track events
  await sdk.events.track({
    eventName: "content.page.view",
    properties: {
      contentId: content.id,
      contentSlug: "my-post-slug",
      pageUrl: "https://example.com/blog/my-post-slug",
    },
  });

  // Get form definition
  const form = await sdk.forms.get({
    formId: "form-uuid",
  });

  console.log(form.name);
  console.log(form.fields);
}

example().catch(console.error);
```

### Browser Usage (Analytics + Forms)

```typescript
import { createBrowserSdk } from "@contentta/sdk/browser";

const sdk = createBrowserSdk({
  apiKey: "YOUR_API_KEY",
  organizationId: "YOUR_ORG_ID",
  batchSize: 10,
  flushInterval: 30000,
  debug: true,
});

// Track custom events
sdk.tracker.track("button_click", {
  buttonId: "cta-signup",
  page: "/pricing",
});

// Auto-track page views (includes scroll depth, time on page, CTA clicks)
sdk.tracker.autoTrackPageViews("content-uuid", "content-slug");

// Embed a form
await sdk.forms.embedForm("form-uuid", "form-container-id");

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  sdk.tracker.destroy();
});
```

## Migrating from v1.x

If you're upgrading from v1.x, please see the [MIGRATION.md](./MIGRATION.md) guide for detailed instructions.

## API Reference

### Main SDK (Server-Side)

Create an SDK client for server-side usage (Node.js, Bun, Deno):

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({
  apiKey: string;        // Required: Your API key
  host?: string;         // Optional: Custom API host (defaults to production)
});
```

#### Content Methods

**`sdk.content.list(params)`**

List content by agent with pagination and filtering.

```typescript
const { posts, total } = await sdk.content.list({
  agentId: string;                  // Required: Agent UUID
  status?: "draft" | "approved" | Array<"draft" | "approved">;  // Optional
  limit?: string;                   // Optional: Default "10", max "100"
  page?: string;                    // Optional: Default "1"
});
```

Returns:
```typescript
{
  posts: Array<{
    id: string;
    meta: { title?: string; description?: string; slug?: string; ... };
    imageUrl: string | null;
    status: "draft" | "approved";
    shareStatus: "private" | "shared";
    createdAt: Date;
    stats: { wordsCount?: string; readTimeMinutes?: string; ... };
    image: { data: string; contentType: string } | null;
  }>;
  total: number;
}
```

**`sdk.content.get(params)`**

Get content by slug.

```typescript
const content = await sdk.content.get({
  slug: string;      // Required: Content slug
  agentId: string;   // Required: Agent UUID
});
```

Returns the full content object with `id`, `body`, `meta`, `status`, `createdAt`, `updatedAt`, etc.

**`sdk.content.getRelatedSlugs(params)`**

Get related content slugs.

```typescript
const slugs = await sdk.content.getRelatedSlugs({
  slug: string;      // Required: Content slug
  agentId: string;   // Required: Agent UUID
});
```

Returns `string[]` (array of related slugs).

**`sdk.content.getAuthor(params)`**

Get author information by agent ID.

```typescript
const author = await sdk.content.getAuthor({
  agentId: string;   // Required: Agent UUID
});
```

Returns:
```typescript
{
  name: string;
  profilePhoto: { data: string; contentType: string } | null;
}
```

**`sdk.content.getImage(params)`**

Get image data for content.

```typescript
const image = await sdk.content.getImage({
  contentId: string; // Required: Content UUID
});
```

Returns `{ data: string; contentType: string } | null` (base64-encoded image).

---

#### Event Methods

**`sdk.events.track(params)`**

Track a single event.

```typescript
await sdk.events.track({
  eventName: string;
  properties: Record<string, unknown>;
});
```

**`sdk.events.batch(params)`**

Track multiple events in a single request (more efficient).

```typescript
await sdk.events.batch({
  events: Array<{
    eventName: string;
    properties: Record<string, unknown>;
    timestamp: number;
  }>;
});
```

---

#### Forms Methods

**`sdk.forms.get(params)`**

Get form definition.

```typescript
const form = await sdk.forms.get({
  formId: string;  // Required: Form UUID
});
```

Returns:
```typescript
{
  id: string;
  name: string;
  description?: string;
  fields: Array<{
    id: string;
    type: "text" | "email" | "textarea" | "checkbox" | "select";
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
  }>;
  settings?: {
    successMessage?: string;
    redirectUrl?: string;
  };
}
```

**`sdk.forms.submit(params)`**

Submit form data.

```typescript
const result = await sdk.forms.submit({
  formId: string;
  data: Record<string, unknown>;
});
```

Returns:
```typescript
{
  success: boolean;
  submissionId: string;
  settings: {
    successMessage?: string;
    redirectUrl?: string;
  };
}
```

---

### Browser SDK

For browser environments, use the dedicated browser SDK:

```typescript
import { createBrowserSdk } from "@contentta/sdk/browser";

const sdk = createBrowserSdk({
  apiKey: string;              // Required: Your API key
  organizationId: string;      // Required: Your organization UUID
  apiUrl?: string;             // Optional: Custom API URL
  batchSize?: number;          // Optional: Event batch size (default: 10)
  flushInterval?: number;      // Optional: Flush interval in ms (default: 30000)
  debug?: boolean;             // Optional: Enable debug logging (default: false)
  enableAnalytics?: boolean;   // Optional: Enable analytics (default: true)
});
```

The browser SDK provides two clients:

#### Event Tracker (`sdk.tracker`)

**`sdk.tracker.track(eventName, properties)`**

Track a custom event.

```typescript
sdk.tracker.track("button_click", {
  buttonId: "cta-signup",
  page: "/pricing",
});
```

**`sdk.tracker.autoTrackPageViews(contentId, contentSlug)`**

Auto-track page views with scroll depth, time on page, and CTA clicks.

```typescript
sdk.tracker.autoTrackPageViews("content-uuid", "content-slug");
```

**`sdk.tracker.flush()`**

Manually flush pending events.

```typescript
await sdk.tracker.flush();
```

**`sdk.tracker.destroy()`**

Clean up and flush final events.

```typescript
sdk.tracker.destroy();
```

---

#### Forms Client (`sdk.forms`)

**`sdk.forms.embedForm(formId, containerId)`**

Embed a form into a DOM container.

```typescript
await sdk.forms.embedForm("form-uuid", "form-container-id");
```

This will:
- Fetch the form definition
- Render the form with pre-styled components
- Set up validation and submission handling
- Track form impressions and submissions
- Handle success messages and redirects

---

### Analytics (PostHog)

For PostHog analytics integration:

```typescript
import { createPostHogHelper } from "@contentta/sdk/posthog";

const posthog = createPostHogHelper();

// Track blog post views
const trackingScript = posthog.trackBlogPostView({
  id: "content-uuid",
  slug: "content-slug",
  title: "Post Title",
  agentId: "agent-uuid",
});

// Inject trackingScript into your HTML
```

## Exported Types

All types are fully documented with TypeScript. Import them for type safety:

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

## Exported Schemas (Zod)

For runtime validation:

```typescript
import {
  // Content schemas
  ContentListResponseSchema,
  ContentSelectSchema,
  ContentMetaSchema,
  ContentRequestSchema,
  ContentStatsSchema,
  ContentStatusValues,
  ContentWithAnalyticsSchema,
  ShareStatusValues,
  GetContentBySlugInputSchema,
  ListContentByAgentInputSchema,
  ImageSchema,

  // Analytics schemas
  AnalyticsResponseSchema,
} from "@contentta/sdk";
```

## Error Handling

The SDK uses structured error handling with detailed error types:

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({ apiKey: "your-api-key" });

try {
  const content = await sdk.content.get({
    slug: "non-existent",
    agentId: "agent-uuid",
  });
} catch (error) {
  // Error includes status code, message, and cause
  console.error("Error:", error.message);
  console.error("Status:", error.status);
  console.error("Cause:", error.cause);
}
```

Common error scenarios:
- **Authentication errors**: Invalid API key
- **Not found errors**: Content/form/agent not found
- **Validation errors**: Invalid input parameters
- **Rate limit errors**: Too many requests

## Types Reference

Shapes shown here reflect the runtime Zod schemas returned by the SDK.

- ContentList
  - posts: Array of summary objects:
    - `id`: string
    - `meta`: { title?: string; description?: string; keywords?: string[]; slug?: string; sources?: string[] }
    - `imageUrl`: string | null
    - `status`: "draft" | "approved"
		- `shareStatus`: "private" | "shared"
    - `stats`: { wordsCount?: string; readTimeMinutes?: string; qualityScore?: string }
    - `createdAt`: Date
    - `image`: { data: string; contentType: string } | null
  - total: number

- ContentSelect
  - `id`: string
  - `agentId`: string
  - `imageUrl`: string | null
  - `body`: string
  - `status`: "draft" | "approved"
	- `shareStatus`: "private" | "shared"
  - `meta`: { title?: string; description?: string; keywords?: string[]; slug?: string; sources?: string[] }
  - `request`: { description: string; layout: "tutorial" | "interview" | "article" | "changelog" }
  - `stats`: { wordsCount?: string; readTimeMinutes?: string; qualityScore?: string }
  - `createdAt`: Date
  - `updatedAt`: Date
  - `image`: { data: string; contentType: string } | null

## Complete Examples

### Example 1: Blog Post Listing with Pagination

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({
  apiKey: process.env.CONTENTTA_API_KEY!,
});

async function getBlogPosts(page = 1, pageSize = 12) {
  try {
    const { posts, total } = await sdk.content.list({
      agentId: process.env.AGENT_ID!,
      status: "approved",
      limit: String(pageSize),
      page: String(page),
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      posts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    throw error;
  }
}

// Usage
const { posts, pagination } = await getBlogPosts(1, 12);
console.log(`Showing ${posts.length} of ${pagination.total} posts`);
```

---

### Example 2: Blog Post Detail Page

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({
  apiKey: process.env.CONTENTTA_API_KEY!,
});

async function getBlogPostDetail(slug: string) {
  const agentId = process.env.AGENT_ID!;

  try {
    // Fetch post, related content, and author in parallel
    const [content, relatedSlugs, author] = await Promise.all([
      sdk.content.get({ slug, agentId }),
      sdk.content.getRelatedSlugs({ slug, agentId }),
      sdk.content.getAuthor({ agentId }),
    ]);

    return {
      content,
      relatedSlugs,
      author,
    };
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
    throw error;
  }
}

// Usage
const { content, relatedSlugs, author } = await getBlogPostDetail("my-post-slug");
console.log(`Title: ${content.meta.title}`);
console.log(`Author: ${author.name}`);
console.log(`Related posts: ${relatedSlugs.length}`);
```

---

### Example 3: Blog with Analytics (Browser)

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

  // Track custom events
  document.querySelectorAll("[data-track]").forEach((element) => {
    element.addEventListener("click", () => {
      const eventName = element.getAttribute("data-track");
      const eventData = JSON.parse(element.getAttribute("data-track-data") || "{}");

      sdk.tracker.track(eventName!, eventData);
    });
  });
});

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  sdk.tracker.destroy();
});
```

---

### Example 4: Contact Form Integration

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

---

### Example 5: Server-Side Event Tracking

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({
  apiKey: process.env.CONTENTTA_API_KEY!,
});

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

// Usage
await trackContentPublication("content-uuid");

await trackBatchEvents([
  { eventName: "content.created", properties: { contentId: "uuid-1" } },
  { eventName: "content.approved", properties: { contentId: "uuid-1" } },
  { eventName: "content.published", properties: { contentId: "uuid-1" } },
]);
```

## Changelog
See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.

## License
Apache License 2.0

## Star History

<a href="https://www.star-history.com/#F-O-T/contentagen-sdk&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=F-O-T/contentagen-sdk&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=F-O-T/contentagen-sdk&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=F-O-T/contentagen-sdk&type=Date" />
 </picture>
</a>
