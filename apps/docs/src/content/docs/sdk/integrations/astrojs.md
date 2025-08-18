---
title: AstroJS Integration
description: How to use @contentagen/sdk in AstroJS projects.
---

## Overview
Integrate ContentaGen SDK with AstroJS to fetch and display dynamic content in your site or blog.

## Environment Setup

### 1. Add to `.env`
```
CONTENTAGEN_API_KEY=your-api-key
CONTENTAGEN_AGENT_ID=your-agent-id
```

### 2. Register with Astro's envField (astro.config.mjs)
```js
import { defineConfig, envField } from "astro/config";
export default defineConfig({
  env: {
    schema: {
      CONTENTAGEN_API_KEY: envField.string({ access: "secret", context: "server" }),
      CONTENTAGEN_AGENT_ID: envField.string({ access: "secret", context: "server" })
    }
  }
  // ...rest of config
});
```

### 3. Initialize SDK in your project
Create `src/contentagen.ts`:
```ts
import { createSdk } from "@contentagen/sdk";
// Use Astro's typed server environment
const { CONTENTAGEN_API_KEY, CONTENTAGEN_AGENT_ID } = Astro.env;
export const sdk = createSdk({ apiKey: CONTENTAGEN_API_KEY });
export const agentId = CONTENTAGEN_AGENT_ID;
```

## Fetching Content (Homepage Example)
Example from `src/pages/index.astro`:
```astro
---
import { sdk, agentId } from "../contentagen";
const response = await sdk.listContentByAgent({
  agentId: [agentId],
  status: ["approved"],
  limit: 20,
  page: 1,
});
const posts = response.posts.sort((a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf());
---
<ul>
  {posts.map(post => (
    <li>
      <a href={`/${post.meta.slug}/`}>
        <img src={post.imageUrl ?? ""} alt={post.meta?.title ?? ""} />
        <h4>{post.meta?.title ?? ""}</h4>
      </a>
    </li>
  ))}
</ul>
```

## Dynamic Routing (Blog Post Example)

> **Important: Use Static Generation for Content Routes**
>
> To avoid hitting ContentaGen SDK rate limits, always use Astro's `getStaticPaths` for blog/content routes. SSR (server-side rendering) will call the SDK on every request, which can quickly exhaust your API quota and slow down your site. Static generation builds all pages at deploy time, making your site fast and reliable.
>
> **Do not use SSR for content-heavy routes.**
>
> If your Astro `output` mode is set to `server`, you must add `export const prerender = true;` to your content route files (e.g., `[...slug].astro`). This ensures static generation even in server mode.
>
> See the example below for proper usage.
Example from `src/pages/[...slug].astro`:
```astro
---
import { sdk, agentId } from "../contentagen";
export async function getStaticPaths() {
  let allPosts = [];
  let currentPage = 1;
  let hasMorePages = true;
  while (hasMorePages) {
    const response = await sdk.listContentByAgent({
      agentId: [agentId],
      status: ["approved"],
      limit: 100,
      page: currentPage,
    });
    const posts = response.posts ?? [];
    allPosts.push(...posts);
    hasMorePages = posts.length === 100;
    currentPage++;
  }
  return allPosts.map(post => ({ params: { slug: post.meta?.slug } }));
}
const { slug } = Astro.params;
const post = await sdk.getContentBySlug({ slug: slug ?? "", agentId });
---
<BlogPost post={post} />
```

## BlogPost Layout Example
Example from `src/layouts/BlogPost.astro`:
```astro
---
import { Image } from "astro:assets";
import Navbar from "../components/Navbar.astro";
import Footer from "../components/Footer.astro";
import BaseHead from "../components/BaseHead.astro";
import FormattedDate from "../components/FormattedDate.astro";
import { marked } from "marked";

const { post } = Astro.props;
const htmlBody = marked.parse(post.body);
---
<BaseHead
  title={post.meta?.title ?? ""}
  description={post.meta?.description ?? ""}
  image={post.imageUrl}
  keywords={post.meta?.keywords}
/>
<Navbar />
<main class="container mx-auto p-4 max-w-4xl">
  <article>
    {post.imageUrl && (
      <div class="mb-8">
        <Image
          src={post.imageUrl}
          alt={post.meta?.title ?? ""}
          width={1020}
          height={510}
          class={"rounded-lg aspect-video object-cover"}
          format="webp"
          loading="lazy"
        />
      </div>
    )}
    <div class="flex flex-col items-center gap-4">
      <header class="text-center flex flex-col items-center gap-4">
        <div class="text-sm text-muted-foreground flex flex-col items-center gap-4">
          <FormattedDate date={new Date(post.createdAt) } />
        </div>
        <h1 class="text-4xl font-bold text-foreground">
          {post.meta?.title ?? ""}
        </h1>
        {post.stats?.readTimeMinutes && (
          <div class="text-sm text-start text-muted-foreground">
            <span>Read time: {post.stats.readTimeMinutes} min</span>
          </div>
        )}
      </header>
      <div class="prose  mx-auto">
        {htmlBody && <div set:html={htmlBody} />}
      </div>
    </div>
  </article>
</main>
<Footer />
```

## Rate Limiting & Static Generation

ContentaGen SDK has strict rate limits. If you use SSR for blog/content routes, every page view will trigger an API call, quickly exhausting your quota and potentially causing downtime. Always use Astro's static generation (`getStaticPaths`) for these routes. This ensures all content is fetched at build time, not per request.

- If your Astro `output` mode is `server`, add `export const prerender = true;` to your content route files to force static generation.
- For dynamic content (e.g., dashboards), consider caching or limiting API calls.
- For blogs, documentation, and marketing sites, static generation is strongly recommended.

## Pagination & Filtering
Use `limit` and `page` to paginate. Filter by status for draft, approved, or generating content.

## Best Practices
- Use Zod schemas for input validation.
- Access rich metadata and stats for each post.
- Handle edge cases (empty results, invalid input).
