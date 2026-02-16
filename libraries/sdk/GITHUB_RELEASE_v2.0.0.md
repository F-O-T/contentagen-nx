# 🎉 Contentta SDK v2.0.0 - Complete Rewrite with oRPC

We're thrilled to announce **Contentta SDK v2.0.0**, a complete rewrite built on [oRPC](https://orpc.dev) for improved type safety, better developer experience, and new features!

## 🚀 What's New

### Type-Safe oRPC Architecture
- **Full TypeScript support** with end-to-end type inference
- **Modular API** with organized namespaces (`content`, `events`, `forms`)
- **Automatic validation** using Zod schemas
- **Structured error handling** with detailed error types

### Unified Browser SDK
New unified browser SDK consolidates event tracking and forms:

```typescript
import { createBrowserSdk } from "@contentta/sdk/browser";

const sdk = createBrowserSdk({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
});

sdk.tracker.track("page_view", { page: "/blog" });
await sdk.forms.embedForm("form-id", "container-id");
```

### Server-Side Event Tracking
Track events from your backend:

```typescript
await sdk.events.track({
  eventName: "content.published",
  properties: { contentId: "uuid" },
});

await sdk.events.batch({ events: [...] }); // Batch for efficiency
```

### Enhanced Forms Integration
```typescript
const form = await sdk.forms.get({ formId: "form-uuid" });
await sdk.forms.submit({ formId: "form-uuid", data: {...} });
```

### Analytics Integration
```typescript
const analytics = await sdk.content.getAnalytics({ contentId: "uuid" });
```

## 💔 Breaking Changes

This is a **major version** with significant breaking changes. All users must migrate from v1.x.

### Quick Migration

| v1.x | v2.0 |
|------|------|
| `@contentagen/sdk` | `@contentta/sdk` |
| `new ContentaGenSDK()` | `createSdk()` |
| `listContentByAgent()` | `sdk.content.list()` |
| `getContentBySlug()` | `sdk.content.get()` |
| `@contentagen/sdk/events` | `@contentta/sdk/browser` |

**See comprehensive migration guides:**
- [MIGRATION.md](./MIGRATION.md) - Step-by-step guide
- [BREAKING_CHANGES.md](./BREAKING_CHANGES.md) - Complete list of changes

## 📦 Installation

```bash
# Uninstall old package
npm uninstall @contentagen/sdk

# Install v2.0
npm install @contentta/sdk
```

## 📚 Complete Documentation

- **[README.md](./README.md)** - Complete API reference
- **[MIGRATION.md](./MIGRATION.md)** - Migration guide
- **[BREAKING_CHANGES.md](./BREAKING_CHANGES.md)** - Breaking changes
- **[CHANGELOG.md](./CHANGELOG.md)** - Full changelog
- **[RELEASE_NOTES_v2.0.0.md](./RELEASE_NOTES_v2.0.0.md)** - Detailed release notes

## 🎯 New Features Summary

### Content Methods
- `sdk.content.list()` - List content with pagination
- `sdk.content.get()` - Get content by slug
- `sdk.content.getRelatedSlugs()` - Get related content
- `sdk.content.getAuthor()` - Get author info
- `sdk.content.getImage()` - Get content image
- `sdk.content.getAnalytics()` - Get analytics (NEW)

### Event Methods (NEW)
- `sdk.events.track()` - Track single event
- `sdk.events.batch()` - Batch track events

### Forms Methods (NEW)
- `sdk.forms.get()` - Get form definition
- `sdk.forms.submit()` - Submit form data

### Browser SDK (NEW)
- `createBrowserSdk()` - Unified browser SDK
- `sdk.tracker.*` - Event tracking
- `sdk.forms.*` - Forms integration

## 🎨 Examples

### Server-Side Usage

```typescript
import { createSdk } from "@contentta/sdk";

const sdk = createSdk({ apiKey: process.env.CONTENTTA_API_KEY! });

// List content
const { posts, total } = await sdk.content.list({
  agentId: "agent-uuid",
  status: "approved",
  limit: "12",
  page: "1",
});

// Get content details
const content = await sdk.content.get({
  agentId: "agent-uuid",
  slug: "my-post",
});

// Track events
await sdk.events.track({
  eventName: "content.published",
  properties: { contentId: content.id },
});
```

### Browser Usage

```typescript
import { createBrowserSdk } from "@contentta/sdk/browser";

const sdk = createBrowserSdk({
  apiKey: "your-api-key",
  organizationId: "org-uuid",
});

// Auto-track page views with scroll depth, time on page, CTA clicks
sdk.tracker.autoTrackPageViews("content-id", "content-slug");

// Embed forms
await sdk.forms.embedForm("form-uuid", "form-container-id");

// Clean up
window.addEventListener("beforeunload", () => {
  sdk.tracker.destroy();
});
```

## ⚡ Performance Improvements

- Smaller bundle size
- Efficient event batching
- Faster serialization with oRPC
- Automatic retry logic

## 🆘 Support & Migration Help

- **v1.x support**: Critical bug fixes only
- **v2.x support**: All new features and improvements

**Need help?**
1. Read the [MIGRATION.md](./MIGRATION.md) guide
2. Check [examples](./README.md#complete-examples)
3. Open an [issue](https://github.com/F-O-T/contentta-nx/issues)

## 🙏 Contributors

Thank you to everyone who contributed to this release!

## 📄 License

Apache License 2.0

---

**Full Documentation**: https://github.com/F-O-T/contentta-nx/blob/master/libraries/sdk
