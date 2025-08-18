---
title: API Reference
description: Methods and types in the ContentaGen SDK.
---

## listContentByAgent
Fetch a list of content for an agent, with pagination and filtering.
```ts
const result = await sdk.listContentByAgent({
  agentId: [agentId],
  status: ["approved"],
  limit: 20,
  page: 1,
});
```

## getContentBySlug
Fetch a content item by its slug.
```ts
const item = await sdk.getContentBySlug({ slug: "your-slug", agentId });
```
