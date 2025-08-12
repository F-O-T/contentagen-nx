# @contentagen/sdk

A JavaScript/TypeScript SDK for accessing the ContentaGen API, providing authentication and content management utilities.

## Installation

```bash
npm install @contentagen/sdk
```

## Usage

### Initialize the SDK

You must provide your API key to initialize the SDK:

```ts
import { createSdk } from '@contentagen/sdk';

const sdk = createSdk({ apiKey: 'YOUR_API_KEY' });
```

### List Content by Agent (with Pagination)

You can paginate results using the optional `limit` (default: 10, min: 1, max: 100) and `page` (default: 1, min: 1) parameters:

```ts
// Fetch the second page of results, 20 items per page
const content = await sdk.listContentByAgent({ agentId: 'agent-uuid', limit: 20, page: 2 });
console.log(content);
```

### Get Content by ID

```ts
const item = await sdk.getContentById({ id: 'content-uuid' });
console.log(item);
```

### Get Content by Slug

```ts
const item = await sdk.getContentBySlug({ slug: 'your-content-slug' });
console.log(item);
```

## API Reference

### `createSdk(config: { apiKey: string })`
Creates and returns a new `ContentaGenSDK` instance.

### `sdk.listContentByAgent(params)`
Fetches a list of content items for a given agent, with pagination support.
- `params` (Zod schema):

  ```ts
  const ListContentByAgentInputSchema = z.object({
    status: z.enum(['draft', 'approved', 'generating']).array(),
    agentId: z.string().uuid('Invalid Agent ID format.'),
    limit: z.number().min(1).max(100).optional().default(10),
    page: z.number().min(1).optional().default(1),
  });
  ```
- Returns: `Promise<ContentSelect[]>`

**Pagination:**
Use `limit` to control the number of items per page, and `page` to select which page of results to fetch.

### `sdk.getContentById(params)`
Fetches a content item by its unique ID.
- `params` (Zod schema):

  ```ts
  const GetContentByIdInputSchema = z.object({
    id: z.string().uuid('Invalid Content ID format.'),
  });
  ```
- Returns: `Promise<ContentSelect>`

### `sdk.getContentBySlug(params)`
Fetches a content item by its slug.
- `params` (Zod schema):

  ```ts
  const GetContentBySlugInputSchema = z.object({
    slug: z.string(),
  });
  ```
- Returns: `Promise<ContentSelect>`

## Error Codes
- `SDK_E001`: API key is missing
- `SDK_E002`: API request failed
- `SDK_E003`: Invalid API response
- `SDK_E004`: Invalid input

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.

## License

GPLv3

