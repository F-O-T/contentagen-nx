# Contentta

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

**Contentta** is a modern, open-source CMS with AI-powered editing capabilities—think Cursor, but for content creation. Built on a scalable monorepo architecture, it features an intelligent Lexical-based editor with inline completions, agentic text editing, and a chat assistant to help you write, refine, and publish content faster.

---

## Key Features

### AI-Powered Content Editor

Built on Lexical with deeply integrated AI assistance at multiple levels:

-   **FIM (Fill-in-the-Middle) Completions**:
    -   **Copilot Mode**: Inline ghost text suggestions as you type
    -   **Cursor Tab Mode**: Multi-line floating panel suggestions
    -   **Diff Mode**: Side-by-side replacement previews
    -   Auto-triggers on typing pauses, cursor movement, punctuation, and newlines
    -   Accept with `Tab`, dismiss with `Escape`, manual invoke with `Ctrl+Space`

-   **Inline Edit (Ctrl+K)**:
    -   Select text and press `Ctrl+K` to open a floating prompt
    -   Enter natural language instructions to transform selected text
    -   Streaming AI responses replace the original selection
    -   Full document context awareness for coherent edits

-   **Chat Assistant (Ctrl+L)**:
    -   Opens a right-side chat panel for interactive content discussion
    -   Send selected text as context to the AI
    -   Full document and selection context tracking
    -   Real-time streaming responses

### Content Planning & Research

AI-powered research and planning tools to create well-informed content:

-   **SERP Analysis**: Analyze search engine results and competition for your target keywords
-   **Competitor Content Analysis**: Extract structure and insights from top-ranking content
-   **Related Keywords Discovery**: Find keyword variations and long-tail opportunities
-   **Content Gap Identification**: Discover missing content opportunities in your niche
-   **Fact Finding**: Gather statistics and expert sources to back up your content
-   **Internal Content Search**: Check existing published content to avoid duplication and identify linking opportunities
-   **Research Validation**: Ensure sufficient research before creating content plans

### Content Analysis & SEO

Real-time content optimization with actionable insights:

-   **SEO Scoring (0-100)**:
    -   Title analysis (length, keyword inclusion)
    -   Meta description optimization (150-160 characters)
    -   Content structure validation
    -   Keyword placement and density (1-2% target)
    -   Link quantity analysis
    -   Image count and alt text optimization
    -   Heading frequency (H2/H3 distribution)
    -   First paragraph and conclusion analysis

-   **Readability Analysis**:
    -   Flesch-Kincaid Reading Ease scoring
    -   Grade level calculation
    -   Target audience profiling (general, technical, academic, casual)
    -   Actionable readability recommendations

-   **Quality Detection**:
    -   Filler phrase detection
    -   Clickbait pattern warnings
    -   Low-value content identification
    -   Tone consistency analysis

### Rich Content Management

-   **Block-Based Editor**:
    -   Tables, code blocks, horizontal rules, links, and checklists
    -   Drag-and-drop content organization
    -   Markdown shortcuts with extended transformers
    -   Smart paste handling for format preservation

-   **Content Lifecycle**:
    -   Draft, published, and archived states
    -   Auto-save with debouncing
    -   Version history tracking
    -   Bulk operations (delete, publish, archive)

-   **SEO & Metadata**:
    -   Title, description, slug, and keyword management
    -   SEO optimization built into the workflow

### AI Writers & Agents

-   **Writer Personas**:
    -   Create custom AI writing personas with profile photos
    -   Define writing guidelines, audience profiles, tone, and style preferences
    -   Associate writers with content for consistent voice
    -   Instruction memory for personalized learning over time

-   **Multi-Agent Orchestration** (Mastra-powered):
    -   **Plan Agent**: Research, SERP analysis, keyword discovery, content planning
    -   **Writer Agent**: Content generation with full editor control (insert, replace, format, structure)
    -   **Inline Edit Agent**: Quick text transformations (shorten, expand, clarify, fix grammar)
    -   **FIM Agent**: Intelligent text completion

-   **Agent Capabilities**:
    -   Insert/replace/delete text at any position
    -   Format text (bold, italic, strikethrough, code)
    -   Insert headings, lists, tables, code blocks, images
    -   Add internal and external links
    -   Optimize meta data (title, description)
    -   Generate quick-answer sections

### Brand Management

Maintain consistent brand voice across all content:

-   **Brand Guidelines**: Define organization-wide brand voice and style
-   **Brand Documents**: Upload reference documents for AI context
-   **Knowledge Base**: Build a brand knowledge base that AI agents reference during content creation

### Content Sharing & Export

-   **Public Sharing**:
    -   Generate shareable public links for content
    -   Toggle share status on/off
    -   Clean public view interface

-   **Multi-Format Export**:
    -   Markdown, JSON, HTML formats
    -   Custom file naming

-   **Multi-Destination Publishing**:
    -   Direct download
    -   GitHub repository integration
    -   Notion export
    -   WordPress publishing
    -   Custom API with webhook support

### Related Content Management

-   Discover related content suggestions
-   Manage content relationships and internal linking
-   Reorder and organize related posts

### Dashboard & Analytics

-   **Home Dashboard**: Content statistics, quick actions, recent content
-   **Content List**: Data table with search, filtering, sorting, and bulk operations
-   **Writer Management**: Statistics, analytics, and detailed writer pages
-   **Usage Tracking**:
    -   Usage line charts over time
    -   Distribution pie charts
    -   Acceptance rate tracking
    -   Usage comparison badges
    -   Plan-based limits

### Team Collaboration

-   **Multi-tenant Organizations**:
    -   Create and manage organization workspaces
    -   Organization-level settings and branding

-   **Team Management**:
    -   Create teams within organizations
    -   Team-specific permissions and access

-   **Member Management**:
    -   Invite members via email
    -   Role-based access control (Owner, Admin, Member)
    -   Manage pending invitations
    -   Member activity tracking

### Billing & Subscriptions

-   **Plan Tiers**:
    -   **FREE**: Basic content creation with limited AI usage
    -   **LITE**: Enhanced AI features with team collaboration and chat access
    -   **PRO**: Unlimited AI, advanced planning mode, priority support

-   **Billing Management**:
    -   View subscription status and billing history
    -   Upgrade/downgrade plans
    -   Monthly and annual pricing options
    -   Stripe-powered payments

### API Access

-   **API Keys**:
    -   Create API keys for programmatic access
    -   Manage and revoke keys
    -   SDK for external integrations

### Administration & Security

-   **Authentication**:
    -   Email/password and Google OAuth via Better Auth
    -   Magic link authentication
    -   Email OTP verification
    -   Two-factor authentication (2FA)
    -   Session management with device tracking

-   **Settings**:
    -   Profile and security management
    -   Theme switching (Light/Dark/System)
    -   Language support (en-US, pt-BR)
    -   Notification preferences

---

## Tech Stack

Contentta is a full-stack application built within an **Nx** monorepo using **Bun**.

| Category       | Technology                                                                                                      |
| :------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Frontend**   | **React 19**, **Vite**, **TypeScript**, **TanStack Router**, **TanStack Query**, **shadcn/ui**, **Tailwind CSS**|
| **Editor**     | **Lexical** (Rich text editor framework)                                                                        |
| **AI**         | **Vercel AI SDK**, **Mastra** (Agent orchestration)                                                             |
| **Backend**    | **ElysiaJS**, **Bun**, **tRPC**, **Drizzle ORM**, **PostgreSQL**                                                |
| **Auth**       | **Better Auth**                                                                                                 |
| **Jobs**       | **BullMQ**, **Redis**                                                                                           |
| **Storage**    | **MinIO** (S3 compatible for file/media storage)                                                                |
| **Security**   | **Arcjet** (Rate limiting & DDoS protection)                                                                    |
| **Analytics**  | **PostHog**                                                                                                     |
| **Email**      | **Resend** (Transactional emails)                                                                               |
| **Payments**   | **Stripe** (Subscription billing)                                                                               |
| **Search**     | **Tavily**, **Exa**, **Firecrawl** (Web search for AI research)                                                 |
| **Tooling**    | **Nx**, **Biome**, **Docker**, **Husky**                                                                        |

---

## Project Structure

This project is a monorepo managed by Nx.

### Apps (`apps/`)

The deployable applications.

```
apps/
├── dashboard/     # React/Vite SPA - main content editor interface
├── server/        # Elysia backend API server
└── worker/        # BullMQ background job processor
```

-   **`dashboard`**: The core CMS single-page application (SPA) built with React, featuring the AI-powered content editor with file-based routing via TanStack Router.
-   **`server`**: The ElysiaJS backend server providing the tRPC API, authentication endpoints, AI integrations, and file storage.
-   **`worker`**: Background job processor using BullMQ for handling async tasks like AI processing, email delivery, and content scheduling.

### Libraries (`libraries/`)

Publishable libraries for external consumption.

| Library            | Purpose                                           |
| ------------------ | ------------------------------------------------- |
| `sdk`              | Official TypeScript SDK (`@f-o-t/contentta-sdk`) for interacting with the Contentta API |
| `content-analysis` | SEO scoring, readability analysis, keyword optimization |
| `markdown`         | CommonMark parser with AST support                |

### Packages (`packages/`)

Shared internal libraries organized by concern. All packages use explicit exports in `package.json`.

#### Core Services

| Package          | Purpose                                           |
| ---------------- | ------------------------------------------------- |
| `agents`         | Mastra AI agents (planning, research, writing, editing) |
| `api`            | tRPC routers and type-safe API layer              |
| `authentication` | Better Auth setup with OAuth, magic links, 2FA    |
| `database`       | Drizzle ORM schemas and repositories              |
| `environment`    | Zod-validated environment variables               |
| `logging`        | Structured logging with Pino and Logtail          |

#### External Integrations

| Package        | Purpose                                |
| -------------- | -------------------------------------- |
| `arcjet`       | Rate limiting and DDoS protection      |
| `cache`        | Redis caching layer                    |
| `files`        | MinIO S3-compatible file storage       |
| `posthog`      | Analytics tracking (client & server)   |
| `queue`        | BullMQ job queue abstractions          |
| `search`       | Web search providers (Tavily, Exa, Firecrawl) |
| `stripe`       | Stripe payments SDK wrapper            |
| `transactional`| React Email templates with Resend      |

#### Feature Modules

| Package        | Purpose                                |
| -------------- | -------------------------------------- |
| `workflows`    | Content workflow automation            |

#### Frontend

| Package        | Purpose                                |
| -------------- | -------------------------------------- |
| `localization` | i18next with en-US/pt-BR support       |
| `ui`           | Radix + Tailwind component library     |

#### Utilities

| Package | Purpose                                     |
| ------- | ------------------------------------------- |
| `utils` | Shared utilities (dates, formatting, errors)|

---

## SDK

Contentta provides an official TypeScript SDK for integrating with the API from external applications.

```bash
npm install @f-o-t/contentta-sdk
```

```typescript
import { createSdk } from "@f-o-t/contentta-sdk";

const sdk = createSdk({
  apiKey: "YOUR_API_KEY",
  locale: "en-US",
});

// List content by agent
const list = await sdk.listContentByAgent({
  agentId: "agent-uuid",
  status: "approved",
  limit: 10,
});

// Get content by slug
const post = await sdk.getContentBySlug({
  slug: "my-post-slug",
  agentId: "agent-uuid",
});

// Stream AI assistant responses
const stream = sdk.streamAssistantResponse({
  message: "Help me write an introduction",
  agentId: "agent-uuid",
});
```

See the [SDK README](./libraries/sdk/README.md) for full documentation.

---

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the Apache-2.0 License. See the [LICENSE.md](LICENSE.md) file for details.
