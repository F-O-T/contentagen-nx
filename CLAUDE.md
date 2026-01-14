# Contentta - Claude Code Guidelines

## Project Overview

Contentta is an **AI-powered Content Management System (CMS)** built as an **Nx monorepo** with Bun as the package manager. The system provides AI-assisted content creation, SERP analysis, content optimization, and team collaboration features.

---

## Technology Stack

### Runtime & Build
| Tool | Version | Purpose |
|------|---------|---------|
| Bun | 2.x | Package manager & runtime |
| Nx | 22.1.3 | Monorepo build system with caching |
| TypeScript | 5.9.3 | Type safety |

### Frontend (Dashboard)
| Library | Version | Purpose |
|---------|---------|---------|
| React | 19.2.0 | UI framework |
| Vite | 7.2.4 | Build tool |
| TanStack Router | 1.139.1 | File-based routing |
| TanStack Query | 5.66.5 | Server state management |
| TanStack Form | 1.26.0 | Form handling |
| TanStack Store | - | Global client state |
| Tailwind CSS | 4.1.16 | Styling |
| Radix UI | - | Component primitives |

### Backend (Server)
| Library | Version | Purpose |
|---------|---------|---------|
| Elysia | 1.4.12 | Bun-first web framework |
| tRPC | 11.4.3 | Type-safe API layer |
| Drizzle ORM | 0.44.2 | Database ORM |
| PostgreSQL | - | Database |
| Better Auth | 1.4.3 | Authentication |
| Arcjet | 1.0.0-beta | Rate limiting & DDoS protection |
| Mastra | - | AI agent orchestration |

### Background Jobs (Worker)
| Library | Version | Purpose |
|---------|---------|---------|
| BullMQ | 5.58.7 | Job queue |
| Redis | (ioredis) | Queue storage |

### Integrations
| Service | Purpose |
|---------|---------|
| Stripe | Subscription billing |
| Resend | Transactional email |
| PostHog | Analytics |
| MinIO | File storage |
| Tavily/Exa/Firecrawl | Web search for AI research |

---

## Monorepo Structure

```
contentta-nx/
├── apps/
│   ├── dashboard/       # React/Vite SPA - main user interface
│   ├── server/          # Elysia backend API server
│   └── worker/          # BullMQ background job processor
├── packages/
│   ├── agents/          # Mastra AI agents (planning, research, editing)
│   ├── api/             # tRPC routers and procedures
│   ├── arcjet/          # Rate limiting & DDoS protection
│   ├── authentication/  # Better Auth setup
│   ├── cache/           # Redis caching layer
│   ├── database/        # Drizzle ORM schemas & repositories
│   ├── environment/     # Zod-validated env vars
│   ├── files/           # MinIO & file utilities
│   ├── logging/         # Pino logger configuration
│   ├── posthog/         # Analytics client
│   ├── queue/           # BullMQ abstractions
│   ├── search/          # Web search providers
│   ├── stripe/          # Stripe SDK wrapper
│   ├── transactional/   # Email templates (React Email)
│   ├── ui/              # Radix + Tailwind components
│   ├── utils/           # Shared utilities
│   └── workflows/       # Workflow engine for account deletion
├── libraries/
│   ├── markdown/        # CommonMark parser with AST
│   ├── content-analysis/# SEO analysis, readability scoring
│   └── sdk/             # TypeScript SDK for Contentta API
├── tooling/
│   └── typescript/      # Shared TypeScript configs
└── lambdas/             # Standalone cleanup scripts
```

---

## Core Domain Concepts

### Database Schemas

| Schema | Purpose |
|--------|---------|
| `content` | Blog posts/articles with status, SEO meta, AI stats |
| `content-version` | Content versioning history |
| `agent` | AI writer personas with tone, voice, SEO rules |
| `brand` | Organization brand guidelines |
| `brand-document` | Reference documents for brand context |
| `chat` | AI chat conversations |
| `instruction-memory` | AI agent memory for learned preferences |
| `related-content` | Content linking/relationships |
| `export-log` | Content export history |

### Content Workflow

1. **Planning** - AI helps plan content structure and outline
2. **Research** - SERP analysis and competitor research
3. **Writing** - AI-assisted content creation
4. **Editing** - AI-powered editing and optimization
5. **Publishing** - Export to various formats

---

## Buildable Package Exports

Packages in `packages/` are buildable TypeScript packages. They use explicit exports in `package.json` to expose specific entry points.

### Export Pattern Types

#### 1. Named Entry Points
Single file exports for specific functionality:
```json
{
   "exports": {
      ".": {
         "default": "./src/index.ts",
         "types": "./dist/src/index.d.ts"
      },
      "./client": {
         "default": "./src/client.ts",
         "types": "./dist/src/client.d.ts"
      },
      "./server": {
         "default": "./src/server.ts",
         "types": "./dist/src/server.d.ts"
      }
   }
}
```

#### 2. Wildcard Entry Points
Pattern-based exports for directories with multiple files:
```json
{
   "exports": {
      "./components/*": {
         "default": "./src/components/*.{ts,tsx}",
         "types": "./dist/src/components/*.d.ts"
      },
      "./repositories/*": {
         "default": "./src/repositories/*.ts",
         "types": "./dist/src/repositories/*.d.ts"
      }
   }
}
```

**Usage:**
```typescript
import { Button } from "@packages/ui/components/button";
import { Spinner } from "@packages/ui/components/spinner";
import { createContent } from "@packages/database/repositories/content-repository";
```

### Standard Package Structure

```json
{
   "name": "@packages/example",
   "type": "module",
   "private": true,
   "exports": {
      ".": {
         "default": "./src/index.ts",
         "types": "./dist/src/index.d.ts"
      }
   },
   "files": ["dist"],
   "scripts": {
      "build": "tsc --build",
      "typecheck": "tsc"
   }
}
```

### Common Export Patterns by Package Type

| Package Type | Exports | Example |
|--------------|---------|---------|
| UI Components | `./components/*`, `./hooks/*`, `./lib/*` | `@packages/ui` |
| Database | `.`, `./client`, `./schema`, `./schemas/*`, `./repositories/*` | `@packages/database` |
| API | `./client`, `./server`, `./schemas/*` | `@packages/api` |
| Utils/Services | `.`, `./client`, `./server` | `@packages/utils` |
| Environment | `./server`, `./worker`, `./client` | `@packages/environment` |

### Import Rules

1. **Always use the export path, never relative paths:**
   ```typescript
   // Good
   import { Button } from "@packages/ui/components/button";

   // Bad (don't bypass exports)
   import { Button } from "@packages/ui/src/components/button";
   ```

2. **Match the export exactly:**
   ```typescript
   // Good - matches "./repositories/*"
   import { createContent } from "@packages/database/repositories/content-repository";

   // Bad - doesn't match any export
   import { createContent } from "@packages/database/content-repository";
   ```

3. **Types are resolved automatically** from the `types` field in exports.

---

## Code Style Rules

### No Barrel Files

Do NOT use barrel files (index.ts/index.tsx) to re-export components or modules.

**Bad:**
```typescript
// features/content/index.ts
export * from "./hooks";
export * from "./ui";
```

**Good:** Import directly from the source file:
```typescript
import { useContent } from "@/features/content/hooks/use-content";
import { ContentEditor } from "@/features/content/ui/content-editor";
```

**Why:**
- Improves tree-shaking and bundle size
- Makes dependencies explicit
- Faster TypeScript compilation
- Easier to trace imports

**Exception:** Package entry points (packages/*/src/index.ts) are allowed for external consumers.

### Biome Lint Suppressions

When you need to suppress a Biome lint rule, use `// biome-ignore` comments. The comment must be placed **directly above the line** that triggers the error.

#### Syntax
```typescript
// biome-ignore lint/[category]/[rule]: [reason]
```

#### Placement Rules

**For JSX props**, place the comment directly above the prop that triggers the error:
```typescript
// Good - comment directly above the key prop
<TableCell
   className="whitespace-nowrap"
   // biome-ignore lint/suspicious/noArrayIndexKey: Static data with no unique identifiers
   key={index}
>

// Bad - comment above the element (won't work for props on separate lines)
// biome-ignore lint/suspicious/noArrayIndexKey: reason
<TableCell
   className="whitespace-nowrap"
   key={index}
>
```

**For single-line elements**, place the comment above the element:
```typescript
// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton array
<Skeleton className="h-8 w-20" key={i} />
```

**For TypeScript code**, place the comment directly above the line:
```typescript
// biome-ignore lint/suspicious/noExplicitAny: Testing invalid input type
expect(evaluateNumber("between", 5, [1] as any)).toBe(false);
```

#### Array Index Keys

**Prefer using descriptive string keys** instead of suppressing the `noArrayIndexKey` rule. Use a template string with a descriptive name and 1-based index:

```typescript
// Good - descriptive string key
{steps.map((_, index) => (
   <div key={`step-${index + 1}`} />
))}

// Good - nested arrays with descriptive keys
{rows.map((row, rowIndex) => (
   <TableRow key={`row-${rowIndex + 1}`}>
      {row.map((cell, cellIndex) => (
         <TableCell key={`cell-${rowIndex + 1}-${cellIndex + 1}`} />
      ))}
   </TableRow>
))}

// Good - skeleton loaders
{Array.from({ length: 5 }).map((_, i) => (
   <Skeleton key={`skeleton-${i + 1}`} />
))}
```

**Why this pattern:**
- Avoids lint suppressions entirely
- Creates human-readable keys for debugging
- 1-based indexing is more intuitive when inspecting the DOM

#### Common Suppressions

| Rule | Use Case |
|------|----------|
| `lint/suspicious/noExplicitAny` | Test files testing invalid input types |
| `lint/correctness/noUnusedVariables` | Variables used in templates or intentionally unused |

#### When to Suppress

Only suppress lint rules when:
1. The rule is a false positive
2. The code is intentionally violating the rule for a valid reason (e.g., testing edge cases)
3. There's no reasonable alternative that satisfies the rule

Always include a brief reason explaining why the suppression is necessary.

### File Naming

Use **kebab-case** for all files:
```
content-editor.tsx
use-content-context.tsx
account-deletion.ts
content-repository.ts
```

### Component Naming

Use **PascalCase** for components, following `[Feature][Action][Type]` pattern:
```typescript
// Component names
ContentEditor              // feature: content, type: editor
ContentDataTable           // feature: content, type: data-table
AgentSettingsSection       // feature: agent, type: section
BrandDocumentCredenza      // feature: brand-document, type: credenza
```

### Hook Naming

Use **use[Feature][Action]** pattern:
```typescript
useActiveOrganization()
useContent()
useCreateContent()
useAgent()
useBrand()
```

### Type/Interface Naming

Use **PascalCase** with descriptive suffixes:
```typescript
// Props interfaces
interface ContentEditorProps { ... }
interface AgentSettingsProps { ... }

// Database types (use Drizzle inference)
type Content = typeof contentTable.$inferSelect;
type NewContent = typeof contentTable.$inferInsert;

// General types
type ContentStatus = "draft" | "published" | "archived";
type SubscriptionPlan = "free" | "lite" | "pro";
```

---

## Feature Folder Structure

Organize features with consistent subfolder patterns:

```
/features/[feature-name]/
├── hooks/
│   ├── use-[feature]-context.tsx
│   └── use-[feature]-[action].ts
├── ui/
│   ├── [feature]-[action]-credenza.tsx
│   └── [feature]-section.tsx
└── utils/ (when needed)
```

**Example - Content Feature:**
```
/features/content/
├── hooks/
│   ├── use-content-context.tsx
│   └── use-content.ts
└── ui/
    ├── content-editor.tsx
    └── content-data-table.tsx
```

---

## Route Organization (TanStack Router)

File-based routing with these conventions:

- **kebab-case** for route files
- **$** prefix for dynamic segments: `$slug`, `$contentId`, `$writerId`
- **_** prefix for layout routes: `_dashboard`
- **index.tsx** for index routes

```
/routes/
├── auth/
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   └── forgot-password.tsx
├── share/
│   └── $contentId.tsx
└── $slug/
    ├── onboarding.tsx
    └── _dashboard/
        ├── home.tsx
        ├── content/
        │   ├── index.tsx
        │   └── $contentId.tsx
        ├── writers/
        │   ├── index.tsx
        │   └── $writerId.tsx
        ├── organization/
        │   ├── index.tsx
        │   ├── members.tsx
        │   ├── teams.tsx
        │   └── invites.tsx
        └── settings/
            ├── index.tsx
            ├── profile.tsx
            ├── security.tsx
            ├── billing.tsx
            ├── api-keys.tsx
            └── usage.tsx
```

---

## Database Patterns (Drizzle ORM)

### Schema Definition
```typescript
// packages/database/src/schemas/content.ts
export const content = pgTable("content", {
   id: uuid("id").primaryKey().defaultRandom(),
   title: text("title").notNull(),
   body: text("body"),
   status: contentStatusEnum("status").default("draft").notNull(),
   seoTitle: text("seo_title"),
   seoDescription: text("seo_description"),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   agentId: uuid("agent_id")
      .references(() => agent.id, { onDelete: "set null" }),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const contentRelations = relations(content, ({ one, many }) => ({
   organization: one(organization, { ... }),
   agent: one(agent, { ... }),
   versions: many(contentVersion),
}));
```

### Repository Pattern
```typescript
// packages/database/src/repositories/content-repository.ts
export async function createContent(
   dbClient: DatabaseInstance,
   data: NewContent,
) {
   try {
      const result = await dbClient
         .insert(content)
         .values(data)
         .returning();
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create content");
   }
}
```

---

## API Patterns (tRPC)

### Procedure Types
```typescript
// packages/api/src/server/trpc.ts
export const publicProcedure = baseProcedure
   .use(arcjetPublicMiddleware);

export const protectedProcedure = baseProcedure
   .use(arcjetProtectedMiddleware)
   .use(isAuthed)
   .use(telemetryMiddleware);
```

### Router Structure
```typescript
// packages/api/src/server/routers/content.ts
export const contentRouter = router({
   create: protectedProcedure
      .input(createContentSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         return createContent(resolvedCtx.db, {
            ...input,
            organizationId: resolvedCtx.organizationId,
         });
      }),

   getAll: protectedProcedure
      .query(async ({ ctx }) => {
         const resolvedCtx = await ctx;
         return getContents(resolvedCtx.db, resolvedCtx.organizationId);
      }),

   delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => { ... }),
});
```

### Available Routers

| Router | Purpose |
|--------|---------|
| `content` | Content CRUD, versioning, export |
| `agent` | AI writer persona management |
| `brand` | Brand guidelines and documents |
| `organization` | Organization settings |
| `organization-teams` | Team management |
| `organization-invites` | Member invitations |
| `billing` | Stripe subscription management |
| `usage` | API usage and credits |
| `account` | User account settings |
| `account-deletion` | Account deletion workflow |
| `session` | Session management |
| `permissions` | Resource permissions |
| `onboarding` | User onboarding flow |

### Middleware Chain
1. Logger middleware
2. Timing middleware
3. Arcjet (rate limiting)
4. Authentication (isAuthed)
5. Telemetry middleware

---

## UI Patterns

### Component Library (CVA + Radix)
```typescript
// packages/ui/src/components/button.tsx
const buttonVariants = cva(
   "inline-flex items-center justify-center gap-2...",
   {
      variants: {
         size: { default: "h-9 px-4", icon: "size-9", sm: "h-8 px-3" },
         variant: { default: "bg-primary", ghost: "hover:bg-accent" }
      },
      defaultVariants: { size: "default", variant: "default" }
   }
);

export function Button({ className, variant, size, ...props }) {
   return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

### TanStack Form Pattern
```typescript
const form = useForm({
   defaultValues: { title: "", body: "" },
   validators: { onBlur: contentSchema },
   onSubmit: async ({ value, formApi }) => {
      await mutation.mutateAsync(value);
      formApi.reset();
   },
});

<form.Field name="title">
   {(field) => (
      <Field>
         <FieldLabel>Title</FieldLabel>
         <Input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
         />
         <FieldError errors={field.state.meta.errors} />
      </Field>
   )}
</form.Field>
```

### Global UI Hooks (TanStack Store)

The dashboard uses global state hooks for managing overlay UI (sheets, modals, dialogs). These hooks use TanStack Store for state management and require a corresponding `Global*` component mounted at the app root.

#### Available Hooks

| Hook | Purpose | Component |
|------|---------|-----------|
| `useSheet` | Forms and data entry | `GlobalSheet` |
| `useCredenza` | Important immediate actions (non-destructive) | `GlobalCredenza` |
| `useAlertDialog` | Destructive confirmations | `GlobalAlertDialog` |

#### useSheet - Forms
Use for forms and data entry that slides in from the side.
```typescript
import { useSheet } from "@/hooks/use-sheet";

function MyComponent() {
   const { openSheet, closeSheet } = useSheet();

   // Open a sheet with a form
   const handleOpen = () => {
      openSheet({
         children: <CreateContentForm onSuccess={closeSheet} />
      });
   };

   return <Button onClick={handleOpen}>New Content</Button>;
}
```

#### useCredenza - Important Immediate Actions
Use for important actions that require immediate user attention but are not destructive (modal on desktop, drawer on mobile).
```typescript
import { useCredenza } from "@/hooks/use-credenza";

function MyComponent() {
   const { openCredenza, closeCredenza } = useCredenza();

   const handleOpen = () => {
      openCredenza({
         children: <AgentSelectorPicker onSelect={closeCredenza} />
      });
   };
}
```

#### useAlertDialog - Destructive Confirmations
Use for confirming destructive or irreversible actions.
```typescript
import { useAlertDialog } from "@/hooks/use-alert-dialog";

function DeleteButton({ contentId }: { contentId: string }) {
   const { openAlertDialog } = useAlertDialog();
   const deleteMutation = useDeleteContent();

   const handleDelete = () => {
      openAlertDialog({
         title: "Delete Content",
         description: "Are you sure? This action cannot be undone.",
         actionLabel: "Delete",
         variant: "destructive",
         onAction: async () => {
            await deleteMutation.mutateAsync(contentId);
         },
      });
   };
}
```

#### When to Use Each

| Scenario | Use |
|----------|-----|
| Creating/editing content, agent, brand | `useSheet` |
| Inviting a member, creating a team | `useSheet` |
| Selecting an AI agent for content | `useCredenza` |
| Selecting export format | `useCredenza` |
| Deleting content or agent | `useAlertDialog` |
| Revoking access, removing a member | `useAlertDialog` |

---

## Import Conventions

### Path Aliases
```typescript
// Within dashboard app
import { Button } from "@/components/button";
import { useSheet } from "@/hooks/use-sheet";
import { ContentEditor } from "@/features/content/ui/content-editor";

// Cross-package imports
import { Button } from "@packages/ui/components/button";
import { serverEnv } from "@packages/environment/server";
```

### Direct Imports Only
Never use index.ts re-exports within apps. Always import from the exact source file:
```typescript
// Good
import { useContent } from "@/features/content/hooks/use-content";

// Bad
import { useContent } from "@/features/content";
```

---

## Environment Variables

### Naming Convention
Use **SCREAMING_SNAKE_CASE** for all environment variables:
```
DATABASE_URL
REDIS_URL
STRIPE_SECRET_KEY
BETTER_AUTH_SECRET
OPENAI_API_KEY
```

### Zod Validation Pattern
```typescript
// packages/environment/src/server.ts
const EnvSchema = z.object({
   DATABASE_URL: z.string(),
   REDIS_URL: z.string().optional().default("redis://localhost:6379"),
   NODE_ENV: z.enum(["development", "production", "test"]),
   OPENAI_API_KEY: z.string(),
});

export type ServerEnv = z.infer<typeof EnvSchema>;
export const serverEnv = parseEnv(process.env, EnvSchema);
```

### Client vs Server Separation
- **Server**: `packages/environment/src/server.ts` - secrets, API keys
- **Worker**: `packages/environment/src/worker.ts` - queue config
- **Client**: Use `VITE_` prefix for frontend-exposed vars

---

## Commands Reference

### Development
```bash
bun dev              # Start dashboard, server, worker in parallel
bun dev:all          # Start all apps and packages
bun dev:server       # Server only
```

### Build
```bash
bun run build        # Build all projects (with Nx caching)
bun run typecheck    # TypeScript checks across workspace
bun run check        # Code quality checks (Biome)
```

### Database
```bash
bun run db:push      # Push schema changes to database
bun run db:studio    # Open Drizzle Studio GUI
```

### Testing
```bash
bun run test         # Run tests with parallelization
```

---

## Error Handling

### Error Classes

The application uses two error classes from `@packages/utils/errors`:

| Class | Layer | Purpose |
|-------|-------|---------|
| `AppError` | Repositories, services | Server-side errors with HTTP status codes |
| `APIError` | tRPC routers | API responses (extends TRPCError) |

### API Package (tRPC Routers)

**Always use `APIError`** in tRPC router files (`packages/api/src/server/routers/*.ts`).

```typescript
import { APIError } from "@packages/utils/errors";
```

#### Available Methods

| Method | tRPC Code | Use Case |
|--------|-----------|----------|
| `APIError.notFound(msg)` | `NOT_FOUND` | Resource not found |
| `APIError.unauthorized(msg)` | `UNAUTHORIZED` | Authentication failures |
| `APIError.forbidden(msg)` | `FORBIDDEN` | Authorization failures |
| `APIError.validation(msg)` | `BAD_REQUEST` | Input validation errors |
| `APIError.conflict(msg)` | `CONFLICT` | Duplicate/conflict errors |
| `APIError.internal(msg)` | `INTERNAL_SERVER_ERROR` | Generic internal errors |

#### Usage Examples

```typescript
// Resource not found
if (!content || content.organizationId !== organizationId) {
   throw APIError.notFound("Content not found");
}

// Authentication check
if (!userId) {
   throw APIError.unauthorized("Unauthorized");
}

// Validation error
if (!storageKey.startsWith(`users/${userId}/`)) {
   throw APIError.validation("Invalid storage key for this user");
}

// Conflict/duplicate
if (existingRecord) {
   throw APIError.conflict("Record already exists");
}

// Internal error (catch blocks)
try {
   await someOperation();
} catch (error) {
   propagateError(error); // Re-throws if already APIError/AppError
   throw APIError.internal("Operation failed");
}
```

#### Do NOT Use

```typescript
// Bad - native Error
throw new Error("Content not found");

// Good - APIError
throw APIError.notFound("Content not found");
```

### Repository Layer (Database)

Use `AppError` in repository files (`packages/database/src/repositories/*.ts`):

```typescript
import { AppError, propagateError } from "@packages/utils/errors";

export async function createContent(db: DatabaseInstance, data: NewContent) {
   try {
      const result = await db.insert(content).values(data).returning();
      return result[0];
   } catch (err) {
      propagateError(err); // Re-throws if already AppError
      throw AppError.database("Failed to create content");
   }
}
```

### Client-Side
- Toast notifications for recoverable errors (via Sonner)
- Error modals for critical/repeated failures
- Error tracking with PostHog telemetry

---

## AI Agents (Mastra)

The application uses Mastra for AI agent orchestration. Agents are defined in `packages/agents/`.

### Available Agents

| Agent | Purpose |
|-------|---------|
| Content Planner | Creates content outlines and structure |
| SERP Analyzer | Analyzes search results for keyword optimization |
| Content Researcher | Gathers information from web sources |
| Content Editor | Edits and improves content quality |
| Quick Edit | Inline content improvements |
| FIM (Fill-in-Middle) | Intelligent text completion |

### Agent Configuration

Each agent has configurable parameters stored in the `agent` table:
- **Tone**: Professional, casual, friendly, etc.
- **Voice**: Brand voice characteristics
- **SEO Rules**: Keyword targeting, density, etc.
- **Instructions**: Custom behavior instructions

---

## Authentication (Better Auth)

### Session Access
```typescript
// In tRPC procedures
const resolvedCtx = await ctx;
const userId = resolvedCtx.userId;
const organizationId = resolvedCtx.organizationId;
```

### Plugins Enabled
- Google OAuth
- Magic Link
- Email OTP
- Two-Factor Authentication (2FA)
- Anonymous sessions (for share links)

---

## Subscription Plans

| Plan | Features |
|------|----------|
| FREE | Basic content creation, limited AI usage |
| LITE | More AI credits, team collaboration |
| PRO | Unlimited AI, advanced features, priority support |
