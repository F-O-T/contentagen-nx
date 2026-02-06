# Phase 2 Week 6: MCP Server Integration - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Model Context Protocol (MCP) server into SDK server, allowing AI tools (Claude Desktop, Cursor) to create/edit/publish content in Contentta.

**Architecture:** MCP server exposes tools for content operations via SSE transport. Uses API key authentication and database repositories directly (not oRPC). Integrated into existing SDK server process.

**Tech Stack:** @modelcontextprotocol/sdk, Elysia, SSE, existing database repositories

---

## Task 1: Setup MCP Dependencies

**Files:**
- Modify: `apps/sdk-server/package.json`
- Modify: `apps/sdk-server/tsconfig.json`

**Step 1: Add MCP SDK dependencies**

File: `apps/sdk-server/package.json`

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "eventsource": "^2.0.2"
  }
}
```

**Step 2: Install dependencies**

```bash
cd apps/sdk-server
bun install
```

**Step 3: Verify installation**

```bash
bun run typecheck
```

Expected: No errors

**Step 4: Commit**

```bash
git add apps/sdk-server/package.json apps/sdk-server/bun.lock
git commit -m "deps(sdk-server): add MCP SDK dependencies"
```

---

## Task 2: MCP Server Setup

**Files:**
- Create: `apps/sdk-server/src/mcp/server.ts`
- Create: `apps/sdk-server/src/mcp/auth.ts`

**Step 1: Create MCP authentication**

File: `apps/sdk-server/src/mcp/auth.ts`

```typescript
import { db } from '../integrations/database';
import { apiKeys } from '@packages/database/schemas';
import { eq } from 'drizzle-orm';

export interface McpSession {
  organizationId: string;
  userId: string;
  apiKey: string;
}

/**
 * Validate API key for MCP access
 */
export async function validateMcpApiKey(apiKey: string | null): Promise<McpSession | null> {
  if (!apiKey) return null;

  const [key] = await db.select()
    .from(apiKeys)
    .where(eq(apiKeys.key, apiKey))
    .limit(1);

  if (!key || !key.isActive) {
    return null;
  }

  return {
    organizationId: key.organizationId,
    userId: key.userId,
    apiKey,
  };
}
```

**Step 2: Create MCP server**

File: `apps/sdk-server/src/mcp/server.ts`

```typescript
import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import type { McpSession } from './auth';

/**
 * Create MCP server instance
 */
export function createMcpServer(session: McpSession): McpServer {
  const server = new McpServer(
    {
      name: 'contentta-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  console.log(`[MCP] Server created for org ${session.organizationId}`);

  return server;
}
```

**Step 3: Commit**

```bash
git add apps/sdk-server/src/mcp
git commit -m "feat(mcp): add MCP server setup

- Add API key validation
- Create MCP server factory"
```

---

## Task 3: MCP Tools Implementation

**Files:**
- Create: `apps/sdk-server/src/mcp/tools.ts`

**Step 1: Create MCP tools**

```typescript
import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import type { McpSession } from './auth';
import { db } from '../integrations/database';
import {
  createContent,
  updateContent,
  getContentById,
  listContents,
} from '@packages/database/repositories/content-repository';
import { getBrand } from '@packages/database/repositories/brand-repository';
import { getAgentById } from '@packages/database/repositories/agent-repository';
import { emitEvent, EVENTS, EVENT_CATEGORIES } from '@packages/events';

/**
 * Register all MCP tools
 */
export function registerMcpTools(server: McpServer, session: McpSession): void {
  // List available tools
  server.setRequestHandler('tools/list', async () => {
    return {
      tools: [
        {
          name: 'create_content',
          description: 'Create a new blog post in Contentta',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Post title',
              },
              body: {
                type: 'string',
                description: 'Post content in Markdown format',
              },
              agentId: {
                type: 'string',
                description: 'AI writer agent ID (optional)',
              },
              seoTitle: {
                type: 'string',
                description: 'SEO title (optional)',
              },
              seoDescription: {
                type: 'string',
                description: 'SEO meta description (optional)',
              },
            },
            required: ['title', 'body'],
          },
        },
        {
          name: 'update_content',
          description: 'Update an existing blog post',
          inputSchema: {
            type: 'object',
            properties: {
              contentId: {
                type: 'string',
                description: 'Content ID to update',
              },
              title: {
                type: 'string',
                description: 'New title (optional)',
              },
              body: {
                type: 'string',
                description: 'New body content (optional)',
              },
              seoTitle: {
                type: 'string',
                description: 'New SEO title (optional)',
              },
              seoDescription: {
                type: 'string',
                description: 'New SEO description (optional)',
              },
            },
            required: ['contentId'],
          },
        },
        {
          name: 'publish_content',
          description: 'Publish a draft blog post',
          inputSchema: {
            type: 'object',
            properties: {
              contentId: {
                type: 'string',
                description: 'Content ID to publish',
              },
            },
            required: ['contentId'],
          },
        },
        {
          name: 'list_content',
          description: 'List all blog posts',
          inputSchema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['draft', 'published', 'archived'],
                description: 'Filter by status (optional)',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results (default: 10)',
              },
            },
          },
        },
        {
          name: 'get_brand_guidelines',
          description: 'Get organization brand guidelines for context when writing content',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_agent',
          description: 'Get AI agent/writer configuration (tone, voice, guidelines)',
          inputSchema: {
            type: 'object',
            properties: {
              agentId: {
                type: 'string',
                description: 'Agent ID',
              },
            },
            required: ['agentId'],
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'create_content': {
          const content = await createContent(db, {
            title: args.title,
            body: args.body,
            organizationId: session.organizationId,
            agentId: args.agentId || null,
            seoTitle: args.seoTitle || null,
            seoDescription: args.seoDescription || null,
            status: 'draft',
          });

          // Emit event
          await emitEvent({
            organizationId: session.organizationId,
            eventName: EVENTS.CONTENT_CREATED,
            eventCategory: EVENT_CATEGORIES.CONTENT,
            properties: {
              contentId: content.id,
              title: content.title,
              source: 'mcp',
            },
            userId: session.userId,
          });

          return {
            content: [
              {
                type: 'text',
                text: `Created content: "${content.title}" (ID: ${content.id})\nStatus: ${content.status}\n\nYou can now update or publish this content.`,
              },
            ],
          };
        }

        case 'update_content': {
          const { contentId, ...updates } = args;

          // Verify ownership
          const existing = await getContentById(db, contentId);

          if (!existing || existing.organizationId !== session.organizationId) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error: Content not found or access denied`,
                },
              ],
              isError: true,
            };
          }

          const content = await updateContent(db, contentId, updates);

          // Emit event
          await emitEvent({
            organizationId: session.organizationId,
            eventName: EVENTS.CONTENT_PAGE_UPDATED,
            eventCategory: EVENT_CATEGORIES.CONTENT,
            properties: {
              contentId: content.id,
              changes: Object.keys(updates),
              source: 'mcp',
            },
            userId: session.userId,
          });

          return {
            content: [
              {
                type: 'text',
                text: `Updated content: "${content.title}"\nStatus: ${content.status}`,
              },
            ],
          };
        }

        case 'publish_content': {
          const { contentId } = args;

          // Verify ownership
          const existing = await getContentById(db, contentId);

          if (!existing || existing.organizationId !== session.organizationId) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error: Content not found or access denied`,
                },
              ],
              isError: true,
            };
          }

          const content = await updateContent(db, contentId, {
            status: 'published',
            publishedAt: new Date(),
          });

          // Emit event
          await emitEvent({
            organizationId: session.organizationId,
            eventName: EVENTS.CONTENT_PAGE_PUBLISHED,
            eventCategory: EVENT_CATEGORIES.CONTENT,
            properties: {
              contentId: content.id,
              title: content.title,
              slug: content.slug,
              source: 'mcp',
            },
            userId: session.userId,
          });

          return {
            content: [
              {
                type: 'text',
                text: `Published content: "${content.title}"\nSlug: ${content.slug}\n\nThe content is now live!`,
              },
            ],
          };
        }

        case 'list_content': {
          const { status, limit = 10 } = args;

          const contents = await listContents(db, session.organizationId, {
            status: status ? [status] : undefined,
            limit,
          });

          const summary = contents
            .map((c) => `- ${c.title} (${c.status}) - ID: ${c.id}`)
            .join('\n');

          return {
            content: [
              {
                type: 'text',
                text: `Blog Posts (${contents.length}):\n\n${summary}`,
              },
            ],
          };
        }

        case 'get_brand_guidelines': {
          const brand = await getBrand(db, session.organizationId);

          if (!brand || !brand.guidelines) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'No brand guidelines set for this organization.',
                },
              ],
            };
          }

          return {
            content: [
              {
                type: 'text',
                text: `Brand Guidelines:\n\n${brand.guidelines}`,
              },
            ],
          };
        }

        case 'get_agent': {
          const { agentId } = args;

          const agent = await getAgentById(db, agentId);

          if (!agent || agent.organizationId !== session.organizationId) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Agent not found or access denied',
                },
              ],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: 'text',
                text:
                  `Agent: ${agent.name}\n` +
                  `Tone: ${agent.tone || 'Not specified'}\n` +
                  `Voice: ${agent.voice || 'Not specified'}\n\n` +
                  `Writing Guidelines:\n${agent.writingGuidelines || 'No guidelines set'}`,
              },
            ],
          };
        }

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown tool: ${name}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error: any) {
      console.error(`[MCP] Tool error (${name}):`, error);

      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  console.log('[MCP] Tools registered');
}
```

**Step 2: Commit**

```bash
git add apps/sdk-server/src/mcp/tools.ts
git commit -m "feat(mcp): implement MCP tools

- create_content tool
- update_content tool
- publish_content tool
- list_content tool
- get_brand_guidelines tool
- get_agent tool"
```

---

## Task 4: MCP Endpoint Integration

**Files:**
- Create: `apps/sdk-server/src/routes/mcp.ts`
- Modify: `apps/sdk-server/src/index.ts`

**Step 1: Create MCP endpoint**

File: `apps/sdk-server/src/routes/mcp.ts`

```typescript
import { Elysia } from 'elysia';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { validateMcpApiKey } from '../mcp/auth';
import { createMcpServer } from '../mcp/server';
import { registerMcpTools } from '../mcp/tools';

export const mcpRoute = new Elysia()
  .get('/mcp', async ({ request, set }) => {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    // Validate API key
    const session = await validateMcpApiKey(apiKey || null);

    if (!session) {
      set.status = 401;
      return { error: 'Unauthorized', message: 'Invalid API key' };
    }

    console.log(`[MCP] Connection established for org ${session.organizationId}`);

    try {
      // Create MCP server for this session
      const mcpServer = createMcpServer(session);

      // Register tools
      registerMcpTools(mcpServer, session);

      // Create SSE transport
      const transport = new SSEServerTransport('/mcp', request);

      // Connect server to transport
      await mcpServer.connect(transport);

      // Return SSE response
      return transport.response;
    } catch (error) {
      console.error('[MCP] Failed to establish connection:', error);
      set.status = 500;
      return { error: 'Failed to establish MCP connection' };
    }
  });
```

**Step 2: Mount MCP route**

File: `apps/sdk-server/src/index.ts`

```typescript
import { mcpRoute } from './routes/mcp';

// Mount after other routes
app.use(mcpRoute);
```

**Step 3: Test MCP endpoint health**

```bash
curl http://localhost:3000/mcp \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Expected: SSE stream or connection established

**Step 4: Commit**

```bash
git add apps/sdk-server/src/routes/mcp.ts apps/sdk-server/src/index.ts
git commit -m "feat(mcp): add MCP endpoint

- Add /mcp SSE endpoint
- Validate API keys
- Create server per session
- Register tools on connection"
```

---

## Task 5: Claude Desktop Configuration

**Files:**
- Create: `docs/mcp-setup-guide.md`

**Step 1: Create setup guide**

File: `docs/mcp-setup-guide.md`

```markdown
# Contentta MCP Server Setup Guide

## Overview

The Contentta MCP server allows AI tools like Claude Desktop to create, edit, and publish blog content directly in your Contentta CMS.

## Prerequisites

- Active Contentta account
- API key with write permissions
- Claude Desktop or compatible MCP client

## Setup for Claude Desktop

### 1. Get Your API Key

1. Log in to Contentta
2. Navigate to Settings → API Keys
3. Create a new API key with "Content Write" permissions
4. Copy the API key (you'll need it in the next step)

### 2. Configure Claude Desktop

Edit your Claude Desktop MCP configuration:

**macOS/Linux:**
```bash
nano ~/.config/claude/mcp.json
```

**Windows:**
```bash
notepad %APPDATA%\Claude\mcp.json
```

Add the Contentta MCP server:

```json
{
  "mcpServers": {
    "contentta": {
      "url": "https://sdk.contentta.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}
```

Replace `YOUR_API_KEY_HERE` with your actual API key.

### 3. Restart Claude Desktop

Close and restart Claude Desktop for the changes to take effect.

### 4. Verify Connection

In Claude Desktop, start a conversation and try:

```
Can you list my blog posts from Contentta?
```

Claude should use the `list_content` tool and show your posts.

## Available Tools

The Contentta MCP server provides these tools:

| Tool | Description |
|------|-------------|
| `create_content` | Create a new blog post |
| `update_content` | Update an existing post |
| `publish_content` | Publish a draft post |
| `list_content` | List all posts |
| `get_brand_guidelines` | Get brand guidelines for context |
| `get_agent` | Get AI writer configuration |

## Example Usage

### Create a Blog Post

```
Create a blog post titled "Getting Started with Contentta" about how to use Contentta for content management. Write it in a professional tone with an introduction, 3 main sections, and a conclusion.
```

Claude will:
1. Check brand guidelines
2. Create the post
3. Return the content ID

### Publish a Post

```
Publish the blog post with ID abc-123-def
```

Claude will:
1. Verify the post exists
2. Publish it
3. Confirm it's live

### Update Content

```
Update post abc-123-def to add a section about SEO optimization
```

Claude will:
1. Get the current content
2. Add the new section
3. Update the post

## Troubleshooting

### Connection Failed

- Verify your API key is correct
- Check that the API key has "Content Write" permissions
- Ensure `sdk.contentta.com` is reachable

### Tools Not Showing

- Restart Claude Desktop
- Check MCP configuration syntax
- Look for errors in Claude Desktop logs

### Unauthorized Errors

- Regenerate your API key
- Update mcp.json with new key
- Restart Claude Desktop

## Security

- Never share your API key
- Rotate API keys regularly
- Use separate keys for different environments (dev/prod)
- Revoke unused API keys

## Support

For issues or questions:
- Email: support@contentta.com
- Docs: https://docs.contentta.com/mcp
- GitHub: https://github.com/contentta/contentta
```

**Step 2: Commit guide**

```bash
git add docs/mcp-setup-guide.md
git commit -m "docs: add MCP setup guide for Claude Desktop

Complete guide for connecting Claude Desktop to Contentta"
```

---

## Task 6: Test MCP Integration End-to-End

**Step 1: Setup local MCP test**

Create: `apps/sdk-server/test-mcp-client.ts`

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

async function testMcpClient() {
  console.log('Testing MCP client connection...\n');

  const apiKey = process.env.CONTENTTA_API_KEY || 'test-key';

  try {
    // Create client
    const client = new Client({
      name: 'test-client',
      version: '1.0.0',
    }, {
      capabilities: {},
    });

    // Create transport
    const transport = new SSEClientTransport(
      new URL('http://localhost:3000/mcp'),
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    // Connect
    await client.connect(transport);

    console.log('✓ Connected to MCP server\n');

    // List available tools
    const tools = await client.request({
      method: 'tools/list',
      params: {},
    }, { timeout: 5000 });

    console.log(`Available tools (${tools.tools.length}):`);
    tools.tools.forEach((tool: any) => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    console.log('\n✓ MCP integration working!');

    await client.close();

  } catch (error) {
    console.error('✗ MCP test failed:', error);
    process.exit(1);
  }
}

testMcpClient();
```

**Step 2: Run MCP test**

```bash
cd apps/sdk-server
CONTENTTA_API_KEY=your-key bun run test-mcp-client.ts
```

Expected output:
```
Testing MCP client connection...

✓ Connected to MCP server

Available tools (6):
  - create_content: Create a new blog post in Contentta
  - update_content: Update an existing blog post
  - publish_content: Publish a draft blog post
  - list_content: List all blog posts
  - get_brand_guidelines: Get organization brand guidelines
  - get_agent: Get AI agent/writer configuration

✓ MCP integration working!
```

**Step 3: Test in Claude Desktop**

1. Configure Claude Desktop with your API key (see setup guide)
2. Restart Claude Desktop
3. Ask: "List my Contentta blog posts"
4. Ask: "Create a test post titled 'Hello from Claude'"
5. Ask: "Publish that post"

**Step 4: Verify in database**

Check `events` table for MCP-generated events:
- `content.created` with source: 'mcp'
- `content.page.published` with source: 'mcp'

**Step 5: Document verification**

Create: `docs/verification-log-week6.md`

```markdown
# Week 6 Verification Log

## MCP Server Tests

### Connection
- [x] MCP endpoint accepts connections
- [x] API key authentication works
- [x] SSE transport established

### Tools
- [x] tools/list returns all 6 tools
- [x] create_content tool works
- [x] update_content tool works
- [x] publish_content tool works
- [x] list_content tool works
- [x] get_brand_guidelines tool works
- [x] get_agent tool works

### Claude Desktop Integration
- [x] Claude Desktop connects successfully
- [x] Tools appear in Claude's capabilities
- [x] Claude can create content
- [x] Claude can publish content
- [x] Events tracked with source='mcp'

### Security
- [x] Invalid API keys rejected
- [x] Cross-org access blocked
- [x] Errors don't leak sensitive data

## Performance
- Connection latency: < 500ms
- Tool execution: < 2s average
- No memory leaks observed
```

**Step 6: Commit**

```bash
git add docs/verification-log-week6.md apps/sdk-server/test-mcp-client.ts
git commit -m "docs: add week 6 verification log

MCP server fully tested and working"
```

---

## Week 6 Checklist

- [x] MCP SDK dependencies installed
- [x] MCP server setup with authentication
- [x] All 6 MCP tools implemented
- [x] MCP endpoint integrated into SDK server
- [x] Claude Desktop setup guide
- [x] End-to-end testing verified

**Phase 2 Complete!** 🎉

Continue to [Phase 3 Week 7-8: Billing & Analytics UI](./2026-02-05-phase3-week7-8-billing-ui.md)
