# Addon-Locked Settings Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement three addon-locked settings pages (Activity Logs, Custom Roles, SSO/Authentication) with full backend support, database schemas, and frontend UIs following PostHog's addon gating pattern.

**Architecture:** Build on existing addon gating infrastructure. Create shared `useHasAddon` hook and `organization_addons` table. Each feature gets dedicated oRPC procedures, database tables, and React components. Activity Logs tracks user actions, Custom Roles enables permission management, SSO enables enterprise authentication.

**Tech Stack:** PostgreSQL (Drizzle ORM), oRPC, React, TanStack Query, Better Auth, existing DataTable pattern, SettingsAddonGatedPage component.

---

## Phase 1: Shared Addon Infrastructure

### Task 1: Create Organization Addons Database Schema

**Files:**
- Create: `packages/database/src/schemas/addons.ts`
- Modify: `packages/database/src/client.ts` (add schema export)

**Step 1: Create the addons schema file**

```typescript
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const organizationAddons = pgTable(
	"organization_addons",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		addonId: text("addon_id").notNull(), // "boost" | "scale" | "enterprise"
		activatedAt: timestamp("activated_at").defaultNow().notNull(),
		expiresAt: timestamp("expires_at"),
		autoRenew: boolean("auto_renew").default(true).notNull(),
		stripeSubscriptionItemId: text("stripe_subscription_item_id"),
	},
	(table) => [
		index("organization_addons_org_idx").on(table.organizationId),
		index("organization_addons_addon_idx").on(table.addonId),
	],
);

export const organizationAddonsRelations = relations(
	organizationAddons,
	({ one }) => ({
		organization: one(organization, {
			fields: [organizationAddons.organizationId],
			references: [organization.id],
		}),
	}),
);
```

**Step 2: Export schema in database client**

In `packages/database/src/client.ts`, add:

```typescript
export * from "./schemas/addons";
```

**Step 3: Push schema to database**

Run: `bun run db:push`
Expected: Migration successful, new table created

**Step 4: Commit**

```bash
git add packages/database/src/schemas/addons.ts packages/database/src/client.ts
git commit -m "feat(database): add organization_addons table schema"
```

---

### Task 2: Create Addon Constants and Types

**Files:**
- Create: `packages/utils/src/addons.ts`

**Step 1: Create addon constants file**

```typescript
export const ADDON_IDS = {
	BOOST: "boost",
	SCALE: "scale",
	ENTERPRISE: "enterprise",
} as const;

export type AddonId = (typeof ADDON_IDS)[keyof typeof ADDON_IDS];

export type AddonInfo = {
	id: AddonId;
	name: string;
	description: string;
	features: string[];
	price: string;
	highlight?: string;
};

export const ADDONS: Record<AddonId, AddonInfo> = {
	boost: {
		id: "boost",
		name: "Boost",
		description: "Controle de acesso avançado para seus projetos",
		features: ["access-control"],
		price: "R$ 99/mês",
		highlight: "Mais popular",
	},
	scale: {
		id: "scale",
		name: "Scale",
		description: "Registro de atividades e análises avançadas",
		features: ["activity-logs", "advanced-analytics"],
		price: "R$ 199/mês",
	},
	enterprise: {
		id: "enterprise",
		name: "Enterprise",
		description: "SSO, funções customizadas e suporte dedicado",
		features: ["custom-roles", "sso", "saml", "oidc", "audit-logs"],
		price: "Sob consulta",
		highlight: "Para empresas",
	},
} as const;

export function hasFeature(
	addonId: AddonId,
	featureId: string,
): boolean {
	return ADDONS[addonId].features.includes(featureId);
}
```

**Step 2: Export from utils package**

In `packages/utils/package.json`, ensure exports includes:

```json
"./addons": "./src/addons.ts"
```

**Step 3: Verify it compiles**

Run: `bunx nx run @packages/utils:typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/utils/src/addons.ts packages/utils/package.json
git commit -m "feat(utils): add addon constants and types"
```

---

### Task 3: Create Addon Check oRPC Procedure

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/organization.ts`

**Step 1: Add hasAddon procedure**

In `organization.ts`, add at the end:

```typescript
/**
 * Check if organization has a specific addon activated
 */
export const hasAddon = protectedProcedure
	.input(z.object({ addonId: z.string() }))
	.handler(async ({ context, input }) => {
		const { db, organizationId } = context;

		const addon = await db.query.organizationAddons.findFirst({
			where: (addons, { eq, and, or, isNull, gt }) =>
				and(
					eq(addons.organizationId, organizationId),
					eq(addons.addonId, input.addonId),
					or(
						isNull(addons.expiresAt),
						gt(addons.expiresAt, new Date()),
					),
				),
		});

		return { hasAddon: !!addon };
	});

/**
 * Get all active addons for organization
 */
export const getAddons = protectedProcedure.handler(
	async ({ context }) => {
		const { db, organizationId } = context;

		const addons = await db.query.organizationAddons.findMany({
			where: (addons, { eq, or, isNull, gt }) =>
				and(
					eq(addons.organizationId, organizationId),
					or(
						isNull(addons.expiresAt),
						gt(addons.expiresAt, new Date()),
					),
				),
		});

		return addons.map((a) => ({
			id: a.id,
			addonId: a.addonId,
			activatedAt: a.activatedAt,
			expiresAt: a.expiresAt,
			autoRenew: a.autoRenew,
		}));
	},
);
```

**Step 2: Add import for organizationAddons schema**

At top of file:

```typescript
import { organizationAddons } from "@packages/database/schemas/addons";
```

**Step 3: Verify it compiles**

Run: `bunx nx run web:typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/web/src/integrations/orpc/router/organization.ts
git commit -m "feat(orpc): add addon check procedures"
```

---

### Task 4: Create useHasAddon Client Hook

**Files:**
- Create: `apps/web/src/hooks/use-has-addon.ts`

**Step 1: Create the hook file**

```typescript
import { ADDON_IDS, type AddonId } from "@packages/utils/addons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { orpc } from "@/integrations/orpc/client";

export function useHasAddon(addonId: AddonId): boolean {
	const { data } = useSuspenseQuery(
		orpc.organization.hasAddon.queryOptions({
			input: { addonId },
		}),
	);

	return data.hasAddon;
}

export function useAddons() {
	const { data: addons } = useSuspenseQuery(
		orpc.organization.getAddons.queryOptions({}),
	);

	const addonSet = useMemo(
		() => new Set(addons.map((a) => a.addonId)),
		[addons],
	);

	return {
		addons,
		hasAddon: (addonId: AddonId) => addonSet.has(addonId),
		hasBoost: addonSet.has(ADDON_IDS.BOOST),
		hasScale: addonSet.has(ADDON_IDS.SCALE),
		hasEnterprise: addonSet.has(ADDON_IDS.ENTERPRISE),
	};
}
```

**Step 2: Verify it compiles**

Run: `bunx nx run web:typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/hooks/use-has-addon.ts
git commit -m "feat(hooks): add useHasAddon and useAddons hooks"
```

---

### Task 5: Update Access Control Page to Use Addon Check

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/project/access-control.tsx`

**Step 1: Replace hardcoded constant with hook**

```typescript
import { ADDON_IDS } from "@packages/utils/addons";
import { Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useHasAddon } from "@/hooks/use-has-addon";
import { ProjectAccessControl } from "@/features/access-control/ui/project-access-control";
import { SettingsAddonGatedPage } from "@/layout/dashboard/ui/settings-addon-gated-page";

export const Route = createFileRoute(
	"/_authenticated/$slug/$teamId/_dashboard/settings/project/access-control",
)({
	component: ProjectAccessControlPage,
});

function AccessControlPageContent() {
	const { teamId } = Route.useParams();
	const hasBoost = useHasAddon(ADDON_IDS.BOOST);

	if (hasBoost) {
		return <ProjectAccessControl teamId={teamId} />;
	}

	return (
		<SettingsAddonGatedPage
			addonDescription="O addon Boost desbloqueia controle de acesso granular, permitindo definir quem pode fazer o quê dentro de cada projeto."
			addonName="Boost"
			description="Defina permissões granulares por projeto."
			features={[
				{
					title: "Permissões por projeto",
					description:
						"Defina quem pode visualizar, editar ou gerenciar cada projeto individualmente",
				},
				{
					title: "Grupos de acesso",
					description:
						"Organize membros em grupos com permissões pré-definidas",
				},
				{
					title: "Auditoria de acesso",
					description:
						"Acompanhe quem acessou e modificou recursos do projeto",
				},
			]}
			icon={ShieldCheck}
			title="Controle de Acesso"
		/>
	);
}

function ProjectAccessControlPage() {
	return (
		<Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
			<AccessControlPageContent />
		</Suspense>
	);
}
```

**Step 2: Verify it compiles**

Run: `bunx nx run web:typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/project/access-control.tsx
git commit -m "feat: use addon check hook for access control gating"
```

---

## Phase 2: Activity Logs (Scale Addon)

### Task 6: Create Activity Logs Database Schema

**Files:**
- Create: `packages/database/src/schemas/activity-logs.ts`
- Modify: `packages/database/src/client.ts`

**Step 1: Create activity logs schema**

```typescript
import { relations, sql } from "drizzle-orm";
import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { organization, team, user } from "./auth";

export const activityLogs = pgTable(
	"activity_logs",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		teamId: uuid("team_id")
			.notNull()
			.references(() => team.id, { onDelete: "cascade" }),
		userId: uuid("user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		action: text("action").notNull(), // "created", "updated", "deleted", "published"
		resourceType: text("resource_type").notNull(), // "content", "form", "dashboard", "insight"
		resourceId: text("resource_id"),
		resourceName: text("resource_name"),
		metadata: jsonb("metadata").$type<Record<string, unknown>>(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("activity_logs_team_idx").on(table.teamId),
		index("activity_logs_user_idx").on(table.userId),
		index("activity_logs_created_idx").on(table.createdAt),
		index("activity_logs_resource_idx").on(
			table.resourceType,
			table.resourceId,
		),
	],
);

export const activityLogsRelations = relations(
	activityLogs,
	({ one }) => ({
		organization: one(organization, {
			fields: [activityLogs.organizationId],
			references: [organization.id],
		}),
		team: one(team, {
			fields: [activityLogs.teamId],
			references: [team.id],
		}),
		user: one(user, {
			fields: [activityLogs.userId],
			references: [user.id],
		}),
	}),
);
```

**Step 2: Export schema**

In `packages/database/src/client.ts`:

```typescript
export * from "./schemas/activity-logs";
```

**Step 3: Push schema**

Run: `bun run db:push`
Expected: Migration successful

**Step 4: Commit**

```bash
git add packages/database/src/schemas/activity-logs.ts packages/database/src/client.ts
git commit -m "feat(database): add activity_logs table schema"
```

---

### Task 7: Create Activity Logs oRPC Router

**Files:**
- Create: `apps/web/src/integrations/orpc/router/activity-logs.ts`
- Modify: `apps/web/src/integrations/orpc/router/index.ts`

**Step 1: Create activity logs router**

```typescript
import { ORPCError } from "@orpc/server";
import { activityLogs } from "@packages/database/schemas/activity-logs";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

const getLogsSchema = z.object({
	teamId: z.string().uuid(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	action: z.string().optional(),
	resourceType: z.string().optional(),
	userId: z.string().uuid().optional(),
	dateFrom: z.string().datetime().optional(),
	dateTo: z.string().datetime().optional(),
});

/**
 * Get activity logs for a team with filters
 */
export const getAll = protectedProcedure
	.input(getLogsSchema)
	.handler(async ({ context, input }) => {
		const { db, organizationId } = context;

		const conditions = [
			eq(activityLogs.organizationId, organizationId),
			eq(activityLogs.teamId, input.teamId),
		];

		if (input.action) {
			conditions.push(eq(activityLogs.action, input.action));
		}

		if (input.resourceType) {
			conditions.push(eq(activityLogs.resourceType, input.resourceType));
		}

		if (input.userId) {
			conditions.push(eq(activityLogs.userId, input.userId));
		}

		if (input.dateFrom) {
			conditions.push(gte(activityLogs.createdAt, new Date(input.dateFrom)));
		}

		if (input.dateTo) {
			conditions.push(lte(activityLogs.createdAt, new Date(input.dateTo)));
		}

		const [logs, countResult] = await Promise.all([
			db.query.activityLogs.findMany({
				where: and(...conditions),
				with: {
					user: {
						columns: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
				},
				orderBy: [desc(activityLogs.createdAt)],
				limit: input.limit,
				offset: input.offset,
			}),
			db
				.select({ count: sql<number>`count(*)` })
				.from(activityLogs)
				.where(and(...conditions)),
		]);

		const total = Number(countResult[0]?.count ?? 0);

		return {
			logs: logs.map((log) => ({
				id: log.id,
				action: log.action,
				resourceType: log.resourceType,
				resourceId: log.resourceId,
				resourceName: log.resourceName,
				metadata: log.metadata,
				ipAddress: log.ipAddress,
				createdAt: log.createdAt,
				user: log.user
					? {
							id: log.user.id,
							name: log.user.name,
							email: log.user.email,
							image: log.user.image,
					  }
					: null,
			})),
			total,
			hasMore: input.offset + input.limit < total,
		};
	});

/**
 * Get available filter options (actions, resource types)
 */
export const getFilters = protectedProcedure
	.input(z.object({ teamId: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { db, organizationId } = context;

		const [actions, resourceTypes] = await Promise.all([
			db
				.selectDistinct({ action: activityLogs.action })
				.from(activityLogs)
				.where(
					and(
						eq(activityLogs.organizationId, organizationId),
						eq(activityLogs.teamId, input.teamId),
					),
				),
			db
				.selectDistinct({ resourceType: activityLogs.resourceType })
				.from(activityLogs)
				.where(
					and(
						eq(activityLogs.organizationId, organizationId),
						eq(activityLogs.teamId, input.teamId),
					),
				),
		]);

		return {
			actions: actions.map((a) => a.action).filter(Boolean),
			resourceTypes: resourceTypes
				.map((r) => r.resourceType)
				.filter(Boolean),
		};
	});
```

**Step 2: Export router**

In `apps/web/src/integrations/orpc/router/index.ts`:

```typescript
import * as activityLogsRouter from "./activity-logs";

export default {
	// ... existing routers
	activityLogs: activityLogsRouter,
	// ...
};
```

**Step 3: Verify it compiles**

Run: `bunx nx run web:typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/web/src/integrations/orpc/router/activity-logs.ts apps/web/src/integrations/orpc/router/index.ts
git commit -m "feat(orpc): add activity logs router"
```

---

### Task 8: Create Activity Logs UI Component

**Files:**
- Create: `apps/web/src/features/activity-logs/ui/project-activity-logs.tsx`

**Step 1: Create component file**

```typescript
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { DataTable } from "@packages/ui/components/data-table";
import { Input } from "@packages/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@packages/ui/components/select";
import { Skeleton } from "@packages/ui/components/skeleton";
import { getInitials } from "@packages/utils/text";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
	Calendar,
	Download,
	Filter,
	Search,
} from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { orpc } from "@/integrations/orpc/client";

type ActivityLog = {
	id: string;
	action: string;
	resourceType: string;
	resourceId: string | null;
	resourceName: string | null;
	metadata: Record<string, unknown> | null;
	ipAddress: string | null;
	createdAt: Date;
	user: {
		id: string;
		name: string;
		email: string;
		image: string | null;
	} | null;
};

const ACTION_LABELS: Record<string, string> = {
	created: "Criou",
	updated: "Atualizou",
	deleted: "Deletou",
	published: "Publicou",
	unpublished: "Despublicou",
};

const RESOURCE_LABELS: Record<string, string> = {
	content: "Conteúdo",
	form: "Formulário",
	dashboard: "Dashboard",
	insight: "Insight",
	integration: "Integração",
};

function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function ActivityLogsSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-96 mt-1" />
				</div>
				<Skeleton className="h-9 w-32" />
			</div>
			<div className="flex gap-3">
				<Skeleton className="h-9 flex-1" />
				<Skeleton className="h-9 w-40" />
				<Skeleton className="h-9 w-40" />
			</div>
			<Skeleton className="h-[400px] w-full" />
		</div>
	);
}

function ActivityLogsErrorFallback({ resetErrorBoundary }: FallbackProps) {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold font-serif">
					Registro de Atividades
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Histórico completo de ações no projeto.
				</p>
			</div>
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<p className="text-sm text-muted-foreground mb-4">
					Não foi possível carregar o registro de atividades
				</p>
				<Button onClick={resetErrorBoundary} variant="outline">
					Tentar novamente
				</Button>
			</div>
		</div>
	);
}

function ActivityLogsContent({ teamId }: { teamId: string }) {
	const [page, setPage] = useState(1);
	const [actionFilter, setActionFilter] = useState<string>("");
	const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("");
	const [searchQuery, setSearchQuery] = useState("");
	const pageSize = 50;

	const { data: logsData } = useSuspenseQuery(
		orpc.activityLogs.getAll.queryOptions({
			input: {
				teamId,
				limit: pageSize,
				offset: (page - 1) * pageSize,
				action: actionFilter || undefined,
				resourceType: resourceTypeFilter || undefined,
			},
		}),
	);

	const { data: filters } = useSuspenseQuery(
		orpc.activityLogs.getFilters.queryOptions({
			input: { teamId },
		}),
	);

	const filteredLogs = useMemo(() => {
		if (!searchQuery.trim()) return logsData.logs;
		const query = searchQuery.toLowerCase();
		return logsData.logs.filter(
			(log) =>
				log.user?.name.toLowerCase().includes(query) ||
				log.user?.email.toLowerCase().includes(query) ||
				log.resourceName?.toLowerCase().includes(query),
		);
	}, [logsData.logs, searchQuery]);

	const columns: ColumnDef<ActivityLog>[] = useMemo(
		() => [
			{
				accessorKey: "createdAt",
				header: "Data/Hora",
				cell: ({ row }) => (
					<span className="text-sm text-muted-foreground">
						{formatDate(new Date(row.original.createdAt))}
					</span>
				),
			},
			{
				accessorKey: "user",
				header: "Usuário",
				cell: ({ row }) => {
					const user = row.original.user;
					if (!user) {
						return (
							<span className="text-sm text-muted-foreground">
								Sistema
							</span>
						);
					}
					return (
						<div className="flex items-center gap-2">
							<Avatar className="size-6">
								<AvatarImage
									alt={user.name}
									src={user.image || undefined}
								/>
								<AvatarFallback className="text-xs">
									{getInitials(user.name)}
								</AvatarFallback>
							</Avatar>
							<span className="text-sm font-medium">{user.name}</span>
						</div>
					);
				},
			},
			{
				accessorKey: "action",
				header: "Ação",
				cell: ({ row }) => (
					<Badge variant="outline">
						{ACTION_LABELS[row.original.action] ?? row.original.action}
					</Badge>
				),
			},
			{
				accessorKey: "resource",
				header: "Recurso",
				cell: ({ row }) => (
					<div className="flex flex-col">
						<span className="text-sm font-medium">
							{row.original.resourceName ?? "Sem nome"}
						</span>
						<span className="text-xs text-muted-foreground">
							{RESOURCE_LABELS[row.original.resourceType] ??
								row.original.resourceType}
						</span>
					</div>
				),
			},
		],
		[],
	);

	const totalPages = Math.ceil(logsData.total / pageSize);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold font-serif">
						Registro de Atividades
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Histórico completo de ações no projeto.
					</p>
				</div>
				<Button size="sm" variant="outline">
					<Download className="size-4 mr-2" />
					Exportar
				</Button>
			</div>

			<div className="flex gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
					<Input
						className="pl-8 h-9"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Pesquisar por usuário ou recurso..."
						value={searchQuery}
					/>
				</div>

				<Select onValueChange={setActionFilter} value={actionFilter}>
					<SelectTrigger className="w-[180px] h-9">
						<Filter className="size-4 mr-2" />
						<SelectValue placeholder="Todas as ações" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">Todas as ações</SelectItem>
						{filters.actions.map((action) => (
							<SelectItem key={action} value={action}>
								{ACTION_LABELS[action] ?? action}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					onValueChange={setResourceTypeFilter}
					value={resourceTypeFilter}
				>
					<SelectTrigger className="w-[180px] h-9">
						<SelectValue placeholder="Todos os recursos" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">Todos os recursos</SelectItem>
						{filters.resourceTypes.map((type) => (
							<SelectItem key={type} value={type}>
								{RESOURCE_LABELS[type] ?? type}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<DataTable
				columns={columns}
				data={filteredLogs}
				getRowId={(row) => row.id}
				pagination={{
					currentPage: page,
					totalPages,
					totalCount: logsData.total,
					pageSize,
					onPageChange: setPage,
				}}
			/>
		</div>
	);
}

export function ProjectActivityLogs({ teamId }: { teamId: string }) {
	return (
		<ErrorBoundary FallbackComponent={ActivityLogsErrorFallback}>
			<Suspense fallback={<ActivityLogsSkeleton />}>
				<ActivityLogsContent teamId={teamId} />
			</Suspense>
		</ErrorBoundary>
	);
}
```

**Step 2: Verify it compiles**

Run: `bunx nx run web:typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/features/activity-logs/ui/project-activity-logs.tsx
git commit -m "feat(activity-logs): add activity logs UI component"
```

---

### Task 9: Update Activity Logs Page with Addon Gating

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/project/activity-logs.tsx`

**Step 1: Replace with gated version**

```typescript
import { ADDON_IDS } from "@packages/utils/addons";
import { Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useHasAddon } from "@/hooks/use-has-addon";
import { ProjectActivityLogs } from "@/features/activity-logs/ui/project-activity-logs";
import { SettingsAddonGatedPage } from "@/layout/dashboard/ui/settings-addon-gated-page";

export const Route = createFileRoute(
	"/_authenticated/$slug/$teamId/_dashboard/settings/project/activity-logs",
)({
	component: ProjectActivityLogsPage,
});

function ActivityLogsPageContent() {
	const { teamId } = Route.useParams();
	const hasScale = useHasAddon(ADDON_IDS.SCALE);

	if (hasScale) {
		return <ProjectActivityLogs teamId={teamId} />;
	}

	return (
		<SettingsAddonGatedPage
			addonDescription="O addon Scale desbloqueia o registro completo de atividades, permitindo rastrear todas as ações realizadas no projeto."
			addonName="Scale"
			description="Histórico completo de ações no projeto."
			features={[
				{
					title: "Histórico completo",
					description:
						"Visualize todas as ações realizadas no projeto com data e autor",
				},
				{
					title: "Filtros avançados",
					description:
						"Filtre atividades por tipo de ação, membro ou período",
				},
				{
					title: "Exportação de logs",
					description:
						"Exporte o registro de atividades para análise externa",
				},
			]}
			icon={ScrollText}
			title="Registro de Atividades"
		/>
	);
}

function ProjectActivityLogsPage() {
	return (
		<Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
			<ActivityLogsPageContent />
		</Suspense>
	);
}
```

**Step 2: Verify it compiles**

Run: `bunx nx run web:typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/project/activity-logs.tsx
git commit -m "feat(activity-logs): add addon gating to activity logs page"
```

---

## Phase 3: Custom Roles (Enterprise Addon)

### Task 10: Create Custom Roles Database Schema

**Files:**
- Create: `packages/database/src/schemas/roles.ts`
- Modify: `packages/database/src/client.ts`

**Step 1: Create roles schema**

```typescript
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { member, organization } from "./auth";

export const customRoles = pgTable(
	"custom_roles",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		description: text("description"),
		permissions: jsonb("permissions")
			.$type<string[]>()
			.notNull()
			.default(sql`'[]'::jsonb`),
		isDefault: boolean("is_default").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("custom_roles_org_idx").on(table.organizationId)],
);

export const memberRoles = pgTable(
	"member_roles",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		memberId: uuid("member_id")
			.notNull()
			.references(() => member.id, { onDelete: "cascade" }),
		roleId: uuid("role_id")
			.notNull()
			.references(() => customRoles.id, { onDelete: "cascade" }),
		assignedAt: timestamp("assigned_at").defaultNow().notNull(),
	},
	(table) => [
		index("member_roles_member_idx").on(table.memberId),
		index("member_roles_role_idx").on(table.roleId),
	],
);

export const customRolesRelations = relations(
	customRoles,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [customRoles.organizationId],
			references: [organization.id],
		}),
		memberRoles: many(memberRoles),
	}),
);

export const memberRolesRelations = relations(memberRoles, ({ one }) => ({
	member: one(member, {
		fields: [memberRoles.memberId],
		references: [member.id],
	}),
	role: one(customRoles, {
		fields: [memberRoles.roleId],
		references: [customRoles.id],
	}),
}));
```

**Step 2: Export schema**

In `packages/database/src/client.ts`:

```typescript
export * from "./schemas/roles";
```

**Step 3: Push schema**

Run: `bun run db:push`
Expected: Migration successful

**Step 4: Commit**

```bash
git add packages/database/src/schemas/roles.ts packages/database/src/client.ts
git commit -m "feat(database): add custom_roles and member_roles tables"
```

---

### Task 11: Create Roles Constants

**Files:**
- Create: `packages/utils/src/permissions.ts`

**Step 1: Create permissions constants**

```typescript
export const PERMISSIONS = {
	// Content permissions
	CONTENT_VIEW: "content:view",
	CONTENT_CREATE: "content:create",
	CONTENT_EDIT: "content:edit",
	CONTENT_DELETE: "content:delete",
	CONTENT_PUBLISH: "content:publish",

	// Form permissions
	FORM_VIEW: "form:view",
	FORM_CREATE: "form:create",
	FORM_EDIT: "form:edit",
	FORM_DELETE: "form:delete",

	// Dashboard permissions
	DASHBOARD_VIEW: "dashboard:view",
	DASHBOARD_CREATE: "dashboard:create",
	DASHBOARD_EDIT: "dashboard:edit",
	DASHBOARD_DELETE: "dashboard:delete",

	// Insight permissions
	INSIGHT_VIEW: "insight:view",
	INSIGHT_CREATE: "insight:create",
	INSIGHT_EDIT: "insight:edit",
	INSIGHT_DELETE: "insight:delete",

	// Team permissions
	TEAM_MANAGE: "team:manage",
	TEAM_SETTINGS: "team:settings",

	// Integration permissions
	INTEGRATION_VIEW: "integration:view",
	INTEGRATION_MANAGE: "integration:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_GROUPS = [
	{
		id: "content",
		label: "Conteúdo",
		permissions: [
			{ id: PERMISSIONS.CONTENT_VIEW, label: "Visualizar" },
			{ id: PERMISSIONS.CONTENT_CREATE, label: "Criar" },
			{ id: PERMISSIONS.CONTENT_EDIT, label: "Editar" },
			{ id: PERMISSIONS.CONTENT_DELETE, label: "Deletar" },
			{ id: PERMISSIONS.CONTENT_PUBLISH, label: "Publicar" },
		],
	},
	{
		id: "forms",
		label: "Formulários",
		permissions: [
			{ id: PERMISSIONS.FORM_VIEW, label: "Visualizar" },
			{ id: PERMISSIONS.FORM_CREATE, label: "Criar" },
			{ id: PERMISSIONS.FORM_EDIT, label: "Editar" },
			{ id: PERMISSIONS.FORM_DELETE, label: "Deletar" },
		],
	},
	{
		id: "dashboards",
		label: "Dashboards",
		permissions: [
			{ id: PERMISSIONS.DASHBOARD_VIEW, label: "Visualizar" },
			{ id: PERMISSIONS.DASHBOARD_CREATE, label: "Criar" },
			{ id: PERMISSIONS.DASHBOARD_EDIT, label: "Editar" },
			{ id: PERMISSIONS.DASHBOARD_DELETE, label: "Deletar" },
		],
	},
	{
		id: "insights",
		label: "Insights",
		permissions: [
			{ id: PERMISSIONS.INSIGHT_VIEW, label: "Visualizar" },
			{ id: PERMISSIONS.INSIGHT_CREATE, label: "Criar" },
			{ id: PERMISSIONS.INSIGHT_EDIT, label: "Editar" },
			{ id: PERMISSIONS.INSIGHT_DELETE, label: "Deletar" },
		],
	},
	{
		id: "team",
		label: "Equipe",
		permissions: [
			{ id: PERMISSIONS.TEAM_MANAGE, label: "Gerenciar membros" },
			{ id: PERMISSIONS.TEAM_SETTINGS, label: "Configurações" },
		],
	},
	{
		id: "integrations",
		label: "Integrações",
		permissions: [
			{ id: PERMISSIONS.INTEGRATION_VIEW, label: "Visualizar" },
			{ id: PERMISSIONS.INTEGRATION_MANAGE, label: "Gerenciar" },
		],
	},
] as const;
```

**Step 2: Export from utils**

In `packages/utils/package.json`, add to exports:

```json
"./permissions": "./src/permissions.ts"
```

**Step 3: Verify it compiles**

Run: `bunx nx run @packages/utils:typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/utils/src/permissions.ts packages/utils/package.json
git commit -m "feat(utils): add permissions constants"
```

---

### Task 12: Create Roles oRPC Router

**Files:**
- Create: `apps/web/src/integrations/orpc/router/roles.ts`
- Modify: `apps/web/src/integrations/orpc/router/index.ts`

**Step 1: Create roles router**

```typescript
import { ORPCError } from "@orpc/server";
import { isOrganizationOwner } from "@packages/database/repositories/auth-repository";
import { customRoles, memberRoles } from "@packages/database/schemas/roles";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

const createRoleSchema = z.object({
	name: z.string().min(1).max(50),
	description: z.string().max(200).optional(),
	permissions: z.array(z.string()),
});

const updateRoleSchema = z.object({
	roleId: z.string().uuid(),
	name: z.string().min(1).max(50).optional(),
	description: z.string().max(200).optional(),
	permissions: z.array(z.string()).optional(),
});

const assignRoleSchema = z.object({
	memberId: z.string().uuid(),
	roleId: z.string().uuid(),
});

/**
 * Get all custom roles for organization
 */
export const getAll = protectedProcedure.handler(
	async ({ context }) => {
		const { db, organizationId } = context;

		const roles = await db.query.customRoles.findMany({
			where: eq(customRoles.organizationId, organizationId),
			with: {
				memberRoles: {
					with: {
						member: {
							with: {
								user: {
									columns: {
										id: true,
										name: true,
										email: true,
									},
								},
							},
						},
					},
				},
			},
		});

		return roles.map((role) => ({
			id: role.id,
			name: role.name,
			description: role.description,
			permissions: role.permissions,
			isDefault: role.isDefault,
			memberCount: role.memberRoles.length,
			createdAt: role.createdAt,
			updatedAt: role.updatedAt,
		}));
	},
);

/**
 * Create a custom role
 */
export const create = protectedProcedure
	.input(createRoleSchema)
	.handler(async ({ context, input }) => {
		const { db, organizationId, userId } = context;

		// Only owners can create roles
		const isOwner = await isOrganizationOwner(
			db,
			userId,
			organizationId,
		);
		if (!isOwner) {
			throw new ORPCError("FORBIDDEN", {
				message: "Only organization owners can create roles",
			});
		}

		const [role] = await db
			.insert(customRoles)
			.values({
				organizationId,
				name: input.name,
				description: input.description,
				permissions: input.permissions,
			})
			.returning();

		return role;
	});

/**
 * Update a custom role
 */
export const update = protectedProcedure
	.input(updateRoleSchema)
	.handler(async ({ context, input }) => {
		const { db, organizationId, userId } = context;

		// Only owners can update roles
		const isOwner = await isOrganizationOwner(
			db,
			userId,
			organizationId,
		);
		if (!isOwner) {
			throw new ORPCError("FORBIDDEN", {
				message: "Only organization owners can update roles",
			});
		}

		// Verify role belongs to organization
		const existing = await db.query.customRoles.findFirst({
			where: and(
				eq(customRoles.id, input.roleId),
				eq(customRoles.organizationId, organizationId),
			),
		});

		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "Role not found",
			});
		}

		if (existing.isDefault) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Cannot modify default roles",
			});
		}

		const updateData: Record<string, unknown> = {};
		if (input.name) updateData.name = input.name;
		if (input.description !== undefined)
			updateData.description = input.description;
		if (input.permissions) updateData.permissions = input.permissions;

		const [updated] = await db
			.update(customRoles)
			.set(updateData)
			.where(eq(customRoles.id, input.roleId))
			.returning();

		return updated;
	});

/**
 * Delete a custom role
 */
export const deleteRole = protectedProcedure
	.input(z.object({ roleId: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { db, organizationId, userId } = context;

		// Only owners can delete roles
		const isOwner = await isOrganizationOwner(
			db,
			userId,
			organizationId,
		);
		if (!isOwner) {
			throw new ORPCError("FORBIDDEN", {
				message: "Only organization owners can delete roles",
			});
		}

		// Verify role belongs to organization
		const existing = await db.query.customRoles.findFirst({
			where: and(
				eq(customRoles.id, input.roleId),
				eq(customRoles.organizationId, organizationId),
			),
		});

		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "Role not found",
			});
		}

		if (existing.isDefault) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Cannot delete default roles",
			});
		}

		await db.delete(customRoles).where(eq(customRoles.id, input.roleId));

		return { success: true };
	});

/**
 * Assign role to member
 */
export const assignRole = protectedProcedure
	.input(assignRoleSchema)
	.handler(async ({ context, input }) => {
		const { db, organizationId } = context;

		// Verify role belongs to organization
		const role = await db.query.customRoles.findFirst({
			where: and(
				eq(customRoles.id, input.roleId),
				eq(customRoles.organizationId, organizationId),
			),
		});

		if (!role) {
			throw new ORPCError("NOT_FOUND", {
				message: "Role not found",
			});
		}

		// Check if already assigned
		const existing = await db.query.memberRoles.findFirst({
			where: and(
				eq(memberRoles.memberId, input.memberId),
				eq(memberRoles.roleId, input.roleId),
			),
		});

		if (existing) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Role already assigned to member",
			});
		}

		const [assignment] = await db
			.insert(memberRoles)
			.values({
				memberId: input.memberId,
				roleId: input.roleId,
			})
			.returning();

		return assignment;
	});

/**
 * Remove role from member
 */
export const removeRole = protectedProcedure
	.input(assignRoleSchema)
	.handler(async ({ context, input }) => {
		const { db } = context;

		await db
			.delete(memberRoles)
			.where(
				and(
					eq(memberRoles.memberId, input.memberId),
					eq(memberRoles.roleId, input.roleId),
				),
			);

		return { success: true };
	});
```

**Step 2: Export router**

In `apps/web/src/integrations/orpc/router/index.ts`:

```typescript
import * as rolesRouter from "./roles";

export default {
	// ... existing routers
	roles: rolesRouter,
	// ...
};
```

**Step 3: Verify it compiles**

Run: `bunx nx run web:typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/web/src/integrations/orpc/router/roles.ts apps/web/src/integrations/orpc/router/index.ts
git commit -m "feat(orpc): add roles router"
```

---

### Task 13: Create Custom Roles UI Component

**Files:**
- Create: `apps/web/src/features/roles/ui/organization-roles.tsx`
- Create: `apps/web/src/features/roles/ui/role-form-dialog.tsx`

**Step 1: Create role form dialog**

In `role-form-dialog.tsx`:

```typescript
import { Button } from "@packages/ui/components/button";
import { Checkbox } from "@packages/ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@packages/ui/components/dialog";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Separator } from "@packages/ui/components/separator";
import { Spinner } from "@packages/ui/components/spinner";
import { Textarea } from "@packages/ui/components/textarea";
import { PERMISSION_GROUPS } from "@packages/utils/permissions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";

type RoleFormDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	role?: {
		id: string;
		name: string;
		description: string | null;
		permissions: string[];
	};
};

export function RoleFormDialog({
	open,
	onOpenChange,
	role,
}: RoleFormDialogProps) {
	const isEdit = !!role;
	const queryClient = useQueryClient();

	const [name, setName] = useState(role?.name ?? "");
	const [description, setDescription] = useState(role?.description ?? "");
	const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
		new Set(role?.permissions ?? []),
	);

	const createMutation = useMutation(
		orpc.roles.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.roles.getAll.queryOptions({}).queryKey,
				});
				toast.success("Função criada com sucesso");
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const updateMutation = useMutation(
		orpc.roles.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.roles.getAll.queryOptions({}).queryKey,
				});
				toast.success("Função atualizada com sucesso");
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	function handleTogglePermission(permissionId: string) {
		setSelectedPermissions((prev) => {
			const next = new Set(prev);
			if (next.has(permissionId)) {
				next.delete(permissionId);
			} else {
				next.add(permissionId);
			}
			return next;
		});
	}

	function handleSubmit() {
		if (isEdit && role) {
			updateMutation.mutate({
				roleId: role.id,
				name,
				description,
				permissions: Array.from(selectedPermissions),
			});
		} else {
			createMutation.mutate({
				name,
				description,
				permissions: Array.from(selectedPermissions),
			});
		}
	}

	const isPending = createMutation.isPending || updateMutation.isPending;
	const isValid = name.trim().length > 0 && selectedPermissions.size > 0;

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Editar função" : "Criar nova função"}
					</DialogTitle>
					<DialogDescription>
						{isEdit
							? "Atualize as permissões e informações da função."
							: "Crie uma função personalizada com permissões específicas."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					<div className="space-y-2">
						<Label htmlFor="role-name">Nome da função</Label>
						<Input
							id="role-name"
							onChange={(e) => setName(e.target.value)}
							placeholder="Ex: Editor de conteúdo"
							value={name}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="role-description">Descrição (opcional)</Label>
						<Textarea
							id="role-description"
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Descreva o propósito desta função..."
							rows={2}
							value={description}
						/>
					</div>

					<Separator />

					<div className="space-y-4">
						<div>
							<h4 className="text-sm font-medium">Permissões</h4>
							<p className="text-xs text-muted-foreground mt-1">
								Selecione as permissões que esta função terá
							</p>
						</div>

						{PERMISSION_GROUPS.map((group) => (
							<div className="space-y-3" key={group.id}>
								<h5 className="text-sm font-medium">{group.label}</h5>
								<div className="grid grid-cols-2 gap-3">
									{group.permissions.map((permission) => (
										<div
											className="flex items-center space-x-2"
											key={permission.id}
										>
											<Checkbox
												checked={selectedPermissions.has(permission.id)}
												id={permission.id}
												onCheckedChange={() =>
													handleTogglePermission(permission.id)
												}
											/>
											<Label
												className="text-sm font-normal cursor-pointer"
												htmlFor={permission.id}
											>
												{permission.label}
											</Label>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>

				<DialogFooter>
					<Button
						disabled={isPending}
						onClick={() => onOpenChange(false)}
						variant="outline"
					>
						Cancelar
					</Button>
					<Button disabled={!isValid || isPending} onClick={handleSubmit}>
						{isPending && <Spinner className="size-4 mr-2" />}
						{isEdit ? "Atualizar" : "Criar função"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
```

**Step 2: Create main roles component**

In `organization-roles.tsx`:

```typescript
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { DataTable } from "@packages/ui/components/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Skeleton } from "@packages/ui/components/skeleton";
import { getInitials } from "@packages/utils/text";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical, Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc } from "@/integrations/orpc/client";
import { RoleFormDialog } from "./role-form-dialog";

type Role = {
	id: string;
	name: string;
	description: string | null;
	permissions: string[];
	isDefault: boolean;
	memberCount: number;
	createdAt: Date;
	updatedAt: Date;
};

function OrganizationRolesSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-96 mt-1" />
				</div>
				<Skeleton className="h-9 w-32" />
			</div>
			<Skeleton className="h-[400px] w-full" />
		</div>
	);
}

function OrganizationRolesErrorFallback({ resetErrorBoundary }: FallbackProps) {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold font-serif">Funções</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Gerencie as funções e permissões da organização.
				</p>
			</div>
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<p className="text-sm text-muted-foreground mb-4">
					Não foi possível carregar as funções
				</p>
				<Button onClick={resetErrorBoundary} variant="outline">
					Tentar novamente
				</Button>
			</div>
		</div>
	);
}

function OrganizationRolesContent() {
	const queryClient = useQueryClient();
	const { openAlertDialog } = useAlertDialog();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingRole, setEditingRole] = useState<Role | undefined>();

	const { data: roles } = useSuspenseQuery(
		orpc.roles.getAll.queryOptions({}),
	);

	const deleteMutation = useMutation(
		orpc.roles.deleteRole.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.roles.getAll.queryOptions({}).queryKey,
				});
				toast.success("Função removida com sucesso");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	function handleCreateRole() {
		setEditingRole(undefined);
		setDialogOpen(true);
	}

	function handleEditRole(role: Role) {
		setEditingRole(role);
		setDialogOpen(true);
	}

	function handleDeleteRole(role: Role) {
		openAlertDialog({
			title: "Remover função",
			description: `Tem certeza que deseja remover a função "${role.name}"? Esta ação não pode ser desfeita.`,
			actionLabel: "Remover",
			cancelLabel: "Cancelar",
			variant: "destructive",
			onAction: async () => {
				await deleteMutation.mutateAsync({ roleId: role.id });
			},
		});
	}

	const columns: ColumnDef<Role>[] = useMemo(
		() => [
			{
				accessorKey: "name",
				header: "Função",
				cell: ({ row }) => (
					<div className="flex flex-col">
						<div className="flex items-center gap-2">
							<span className="font-medium">{row.original.name}</span>
							{row.original.isDefault && (
								<Badge variant="secondary">Padrão</Badge>
							)}
						</div>
						{row.original.description && (
							<span className="text-xs text-muted-foreground mt-0.5">
								{row.original.description}
							</span>
						)}
					</div>
				),
			},
			{
				accessorKey: "memberCount",
				header: "Membros",
				cell: ({ row }) => (
					<Badge variant="outline">
						{row.original.memberCount}{" "}
						{row.original.memberCount === 1 ? "membro" : "membros"}
					</Badge>
				),
			},
			{
				accessorKey: "permissions",
				header: "Permissões",
				cell: ({ row }) => (
					<span className="text-sm text-muted-foreground">
						{row.original.permissions.length}{" "}
						{row.original.permissions.length === 1
							? "permissão"
							: "permissões"}
					</span>
				),
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => {
					const role = row.original;
					if (role.isDefault) return null;

					return (
						<div className="flex justify-end">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button size="icon" variant="ghost">
										<EllipsisVertical className="size-4" />
										<span className="sr-only">Ações</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={() => handleEditRole(role)}>
										<Pencil className="size-4 mr-2" />
										Editar função
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="text-destructive focus:text-destructive"
										onClick={() => handleDeleteRole(role)}
									>
										<Trash2 className="size-4 mr-2" />
										Remover função
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					);
				},
			},
		],
		[],
	);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold font-serif">Funções</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Gerencie as funções e permissões da organização.
					</p>
				</div>
				<Button onClick={handleCreateRole} size="sm">
					<Plus className="size-4 mr-2" />
					Criar função
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={roles}
				getRowId={(row) => row.id}
			/>

			<RoleFormDialog
				onOpenChange={setDialogOpen}
				open={dialogOpen}
				role={editingRole}
			/>
		</div>
	);
}

export function OrganizationRoles() {
	return (
		<ErrorBoundary FallbackComponent={OrganizationRolesErrorFallback}>
			<Suspense fallback={<OrganizationRolesSkeleton />}>
				<OrganizationRolesContent />
			</Suspense>
		</ErrorBoundary>
	);
}
```

**Step 3: Verify it compiles**

Run: `bunx nx run web:typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/web/src/features/roles/ui/
git commit -m "feat(roles): add custom roles UI components"
```

---

### Task 14: Update Roles Page with Addon Gating

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/organization/roles.tsx`

**Step 1: Replace with gated version**

```typescript
import { ADDON_IDS } from "@packages/utils/addons";
import { Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UserCog } from "lucide-react";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useHasAddon } from "@/hooks/use-has-addon";
import { OrganizationRoles } from "@/features/roles/ui/organization-roles";
import { SettingsAddonGatedPage } from "@/layout/dashboard/ui/settings-addon-gated-page";

export const Route = createFileRoute(
	"/_authenticated/$slug/$teamId/_dashboard/settings/organization/roles",
)({
	component: OrgRolesPage,
});

function RolesPageContent() {
	const hasEnterprise = useHasAddon(ADDON_IDS.ENTERPRISE);

	if (hasEnterprise) {
		return <OrganizationRoles />;
	}

	return (
		<SettingsAddonGatedPage
			addonDescription="O addon Enterprise desbloqueia funções personalizadas, permitindo criar permissões granulares para diferentes tipos de usuários."
			addonName="Enterprise"
			description="Crie funções customizadas com permissões específicas."
			features={[
				{
					title: "Funções ilimitadas",
					description:
						"Crie quantas funções personalizadas precisar para sua organização",
				},
				{
					title: "Permissões granulares",
					description:
						"Controle acesso por recurso: criar, editar, visualizar, deletar",
				},
				{
					title: "Atribuição flexível",
					description:
						"Atribua múltiplas funções a um mesmo membro conforme necessário",
				},
			]}
			icon={UserCog}
			title="Funções"
		/>
	);
}

function OrgRolesPage() {
	return (
		<Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
			<RolesPageContent />
		</Suspense>
	);
}
```

**Step 2: Verify it compiles**

Run: `bunx nx run web:typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/organization/roles.tsx
git commit -m "feat(roles): add addon gating to roles page"
```

---

## Phase 4: SSO & Authentication (Enterprise Addon)

### Task 15: Create SSO Database Schema

**Files:**
- Create: `packages/database/src/schemas/sso.ts`
- Modify: `packages/database/src/client.ts`

**Step 1: Create SSO schema**

```typescript
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const verifiedDomains = pgTable(
	"verified_domains",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		domain: text("domain").notNull(),
		verificationToken: text("verification_token").notNull(),
		verified: boolean("verified").default(false).notNull(),
		verifiedAt: timestamp("verified_at"),
		autoJoinEnabled: boolean("auto_join_enabled").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("verified_domains_org_idx").on(table.organizationId),
		index("verified_domains_domain_idx").on(table.domain),
	],
);

export const ssoConfigurations = pgTable(
	"sso_configurations",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		provider: text("provider").notNull(), // "saml" | "oidc" | "google" | "okta"
		enabled: boolean("enabled").default(false).notNull(),
		config: jsonb("config").$type<Record<string, unknown>>().notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("sso_configurations_org_idx").on(table.organizationId),
	],
);

export const verifiedDomainsRelations = relations(
	verifiedDomains,
	({ one }) => ({
		organization: one(organization, {
			fields: [verifiedDomains.organizationId],
			references: [organization.id],
		}),
	}),
);

export const ssoConfigurationsRelations = relations(
	ssoConfigurations,
	({ one }) => ({
		organization: one(organization, {
			fields: [ssoConfigurations.organizationId],
			references: [organization.id],
		}),
	}),
);
```

**Step 2: Export schema**

In `packages/database/src/client.ts`:

```typescript
export * from "./schemas/sso";
```

**Step 3: Push schema**

Run: `bun run db:push`
Expected: Migration successful

**Step 4: Commit**

```bash
git add packages/database/src/schemas/sso.ts packages/database/src/client.ts
git commit -m "feat(database): add SSO and verified domains tables"
```

---

### Task 16: Create SSO oRPC Router

**Files:**
- Create: `apps/web/src/integrations/orpc/router/sso.ts`
- Modify: `apps/web/src/integrations/orpc/router/index.ts`

**Step 1: Create SSO router**

```typescript
import { ORPCError } from "@orpc/server";
import { isOrganizationOwner } from "@packages/database/repositories/auth-repository";
import {
	ssoConfigurations,
	verifiedDomains,
} from "@packages/database/schemas/sso";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

const addDomainSchema = z.object({
	domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/),
});

const configureSAMLSchema = z.object({
	entityId: z.string().url(),
	ssoUrl: z.string().url(),
	certificate: z.string(),
});

const configureOIDCSchema = z.object({
	issuer: z.string().url(),
	clientId: z.string(),
	clientSecret: z.string(),
});

/**
 * Get all verified domains for organization
 */
export const getDomains = protectedProcedure.handler(
	async ({ context }) => {
		const { db, organizationId } = context;

		const domains = await db.query.verifiedDomains.findMany({
			where: eq(verifiedDomains.organizationId, organizationId),
		});

		return domains.map((d) => ({
			id: d.id,
			domain: d.domain,
			verified: d.verified,
			verifiedAt: d.verifiedAt,
			autoJoinEnabled: d.autoJoinEnabled,
			createdAt: d.createdAt,
		}));
	},
);

/**
 * Add domain for verification
 */
export const addDomain = protectedProcedure
	.input(addDomainSchema)
	.handler(async ({ context, input }) => {
		const { db, organizationId, userId } = context;

		// Only owners can add domains
		const isOwner = await isOrganizationOwner(
			db,
			userId,
			organizationId,
		);
		if (!isOwner) {
			throw new ORPCError("FORBIDDEN", {
				message: "Only organization owners can add domains",
			});
		}

		// Check if domain already exists
		const existing = await db.query.verifiedDomains.findFirst({
			where: and(
				eq(verifiedDomains.organizationId, organizationId),
				eq(verifiedDomains.domain, input.domain),
			),
		});

		if (existing) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Domain already added",
			});
		}

		// Generate verification token
		const verificationToken = `contentta-domain-verification-${crypto.randomUUID()}`;

		const [domain] = await db
			.insert(verifiedDomains)
			.values({
				organizationId,
				domain: input.domain,
				verificationToken,
			})
			.returning();

		return {
			id: domain.id,
			domain: domain.domain,
			verificationToken: domain.verificationToken,
			verified: domain.verified,
		};
	});

/**
 * Verify domain ownership
 */
export const verifyDomain = protectedProcedure
	.input(z.object({ domainId: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { db, organizationId } = context;

		const domain = await db.query.verifiedDomains.findFirst({
			where: and(
				eq(verifiedDomains.id, input.domainId),
				eq(verifiedDomains.organizationId, organizationId),
			),
		});

		if (!domain) {
			throw new ORPCError("NOT_FOUND", {
				message: "Domain not found",
			});
		}

		if (domain.verified) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Domain already verified",
			});
		}

		// TODO: Implement actual DNS TXT record verification
		// For now, simulate verification
		const verified = true; // await verifyDNSRecord(domain.domain, domain.verificationToken)

		if (!verified) {
			throw new ORPCError("BAD_REQUEST", {
				message:
					"Domain verification failed. Please ensure the TXT record is correctly configured.",
			});
		}

		const [updated] = await db
			.update(verifiedDomains)
			.set({
				verified: true,
				verifiedAt: new Date(),
			})
			.where(eq(verifiedDomains.id, input.domainId))
			.returning();

		return {
			id: updated.id,
			domain: updated.domain,
			verified: updated.verified,
			verifiedAt: updated.verifiedAt,
		};
	});

/**
 * Remove domain
 */
export const removeDomain = protectedProcedure
	.input(z.object({ domainId: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { db, organizationId, userId } = context;

		// Only owners can remove domains
		const isOwner = await isOrganizationOwner(
			db,
			userId,
			organizationId,
		);
		if (!isOwner) {
			throw new ORPCError("FORBIDDEN", {
				message: "Only organization owners can remove domains",
			});
		}

		await db
			.delete(verifiedDomains)
			.where(
				and(
					eq(verifiedDomains.id, input.domainId),
					eq(verifiedDomains.organizationId, organizationId),
				),
			);

		return { success: true };
	});

/**
 * Toggle auto-join for domain
 */
export const toggleAutoJoin = protectedProcedure
	.input(
		z.object({
			domainId: z.string().uuid(),
			enabled: z.boolean(),
		}),
	)
	.handler(async ({ context, input }) => {
		const { db, organizationId, userId } = context;

		// Only owners can toggle auto-join
		const isOwner = await isOrganizationOwner(
			db,
			userId,
			organizationId,
		);
		if (!isOwner) {
			throw new ORPCError("FORBIDDEN", {
				message: "Only organization owners can configure auto-join",
			});
		}

		const [updated] = await db
			.update(verifiedDomains)
			.set({ autoJoinEnabled: input.enabled })
			.where(
				and(
					eq(verifiedDomains.id, input.domainId),
					eq(verifiedDomains.organizationId, organizationId),
				),
			)
			.returning();

		return {
			id: updated.id,
			autoJoinEnabled: updated.autoJoinEnabled,
		};
	});

/**
 * Get SSO configurations
 */
export const getConfigurations = protectedProcedure.handler(
	async ({ context }) => {
		const { db, organizationId } = context;

		const configs = await db.query.ssoConfigurations.findMany({
			where: eq(ssoConfigurations.organizationId, organizationId),
		});

		// Redact sensitive fields
		return configs.map((c) => ({
			id: c.id,
			provider: c.provider,
			enabled: c.enabled,
			config: {
				// Return safe config fields only
				...c.config,
				clientSecret: undefined,
				certificate: undefined,
			},
			createdAt: c.createdAt,
			updatedAt: c.updatedAt,
		}));
	},
);

/**
 * Configure SAML SSO
 */
export const configureSAML = protectedProcedure
	.input(configureSAMLSchema)
	.handler(async ({ context, input }) => {
		const { db, organizationId, userId } = context;

		// Only owners can configure SSO
		const isOwner = await isOrganizationOwner(
			db,
			userId,
			organizationId,
		);
		if (!isOwner) {
			throw new ORPCError("FORBIDDEN", {
				message: "Only organization owners can configure SSO",
			});
		}

		// Check if SAML config already exists
		const existing = await db.query.ssoConfigurations.findFirst({
			where: and(
				eq(ssoConfigurations.organizationId, organizationId),
				eq(ssoConfigurations.provider, "saml"),
			),
		});

		if (existing) {
			// Update existing
			const [updated] = await db
				.update(ssoConfigurations)
				.set({
					config: input,
					updatedAt: new Date(),
				})
				.where(eq(ssoConfigurations.id, existing.id))
				.returning();

			return {
				id: updated.id,
				provider: updated.provider,
				enabled: updated.enabled,
			};
		}

		// Create new
		const [config] = await db
			.insert(ssoConfigurations)
			.values({
				organizationId,
				provider: "saml",
				enabled: false,
				config: input,
			})
			.returning();

		return {
			id: config.id,
			provider: config.provider,
			enabled: config.enabled,
		};
	});

/**
 * Configure OIDC SSO
 */
export const configureOIDC = protectedProcedure
	.input(configureOIDCSchema)
	.handler(async ({ context, input }) => {
		const { db, organizationId, userId } = context;

		// Only owners can configure SSO
		const isOwner = await isOrganizationOwner(
			db,
			userId,
			organizationId,
		);
		if (!isOwner) {
			throw new ORPCError("FORBIDDEN", {
				message: "Only organization owners can configure SSO",
			});
		}

		// Check if OIDC config already exists
		const existing = await db.query.ssoConfigurations.findFirst({
			where: and(
				eq(ssoConfigurations.organizationId, organizationId),
				eq(ssoConfigurations.provider, "oidc"),
			),
		});

		if (existing) {
			// Update existing
			const [updated] = await db
				.update(ssoConfigurations)
				.set({
					config: input,
					updatedAt: new Date(),
				})
				.where(eq(ssoConfigurations.id, existing.id))
				.returning();

			return {
				id: updated.id,
				provider: updated.provider,
				enabled: updated.enabled,
			};
		}

		// Create new
		const [config] = await db
			.insert(ssoConfigurations)
			.values({
				organizationId,
				provider: "oidc",
				enabled: false,
				config: input,
			})
			.returning();

		return {
			id: config.id,
			provider: config.provider,
			enabled: config.enabled,
		};
	});

/**
 * Toggle SSO configuration enabled state
 */
export const toggleConfiguration = protectedProcedure
	.input(
		z.object({
			configId: z.string().uuid(),
			enabled: z.boolean(),
		}),
	)
	.handler(async ({ context, input }) => {
		const { db, organizationId, userId } = context;

		// Only owners can toggle SSO
		const isOwner = await isOrganizationOwner(
			db,
			userId,
			organizationId,
		);
		if (!isOwner) {
			throw new ORPCError("FORBIDDEN", {
				message: "Only organization owners can configure SSO",
			});
		}

		const [updated] = await db
			.update(ssoConfigurations)
			.set({ enabled: input.enabled })
			.where(
				and(
					eq(ssoConfigurations.id, input.configId),
					eq(ssoConfigurations.organizationId, organizationId),
				),
			)
			.returning();

		return {
			id: updated.id,
			enabled: updated.enabled,
		};
	});
```

**Step 2: Export router**

In `apps/web/src/integrations/orpc/router/index.ts`:

```typescript
import * as ssoRouter from "./sso";

export default {
	// ... existing routers
	sso: ssoRouter,
	// ...
};
```

**Step 3: Verify it compiles**

Run: `bunx nx run web:typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/web/src/integrations/orpc/router/sso.ts apps/web/src/integrations/orpc/router/index.ts
git commit -m "feat(orpc): add SSO router"
```

---

### Task 17: Create SSO UI Components

**Files:**
- Create: `apps/web/src/features/sso/ui/organization-authentication.tsx`
- Create: `apps/web/src/features/sso/ui/domain-verification-dialog.tsx`
- Create: `apps/web/src/features/sso/ui/sso-config-dialog.tsx`

**Step 1: Create domain verification dialog**

In `domain-verification-dialog.tsx`:

```typescript
import { Button } from "@packages/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@packages/ui/components/dialog";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Spinner } from "@packages/ui/components/spinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";

type DomainVerificationDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	domain?: {
		id: string;
		domain: string;
		verificationToken: string;
		verified: boolean;
	};
};

export function DomainVerificationDialog({
	open,
	onOpenChange,
	domain,
}: DomainVerificationDialogProps) {
	const queryClient = useQueryClient();
	const [newDomain, setNewDomain] = useState("");
	const [addedDomain, setAddedDomain] = useState<{
		id: string;
		domain: string;
		verificationToken: string;
	} | null>(null);

	const addMutation = useMutation(
		orpc.sso.addDomain.mutationOptions({
			onSuccess: (data) => {
				setAddedDomain(data);
				setNewDomain("");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const verifyMutation = useMutation(
		orpc.sso.verifyDomain.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.sso.getDomains.queryOptions({}).queryKey,
				});
				toast.success("Domínio verificado com sucesso!");
				onOpenChange(false);
				setAddedDomain(null);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	function handleCopyToken() {
		if (addedDomain) {
			navigator.clipboard.writeText(addedDomain.verificationToken);
			toast.success("Token copiado!");
		}
	}

	function handleVerify() {
		if (addedDomain) {
			verifyMutation.mutate({ domainId: addedDomain.id });
		}
	}

	const currentDomain = domain || addedDomain;

	return (
		<Dialog
			onOpenChange={(open) => {
				onOpenChange(open);
				if (!open) {
					setAddedDomain(null);
					setNewDomain("");
				}
			}}
			open={open}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{currentDomain ? "Verificar domínio" : "Adicionar domínio"}
					</DialogTitle>
					<DialogDescription>
						{currentDomain
							? "Configure o registro TXT DNS para verificar a propriedade do domínio."
							: "Adicione um domínio para permitir autenticação SSO."}
					</DialogDescription>
				</DialogHeader>

				{!currentDomain ? (
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="domain">Domínio</Label>
							<Input
								id="domain"
								onChange={(e) => setNewDomain(e.target.value)}
								placeholder="exemplo.com"
								value={newDomain}
							/>
							<p className="text-xs text-muted-foreground">
								Digite apenas o domínio, sem http:// ou www.
							</p>
						</div>
					</div>
				) : (
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>Domínio</Label>
							<Input disabled value={currentDomain.domain} />
						</div>

						<div className="space-y-2">
							<Label>Registro TXT DNS</Label>
							<div className="flex gap-2">
								<Input
									className="font-mono text-xs"
									readOnly
									value={currentDomain.verificationToken}
								/>
								<Button
									onClick={handleCopyToken}
									size="icon"
									variant="outline"
								>
									<Copy className="size-4" />
								</Button>
							</div>
							<p className="text-xs text-muted-foreground">
								Adicione este valor como registro TXT no seu provedor DNS
							</p>
						</div>

						<div className="rounded-md border bg-muted/50 p-3">
							<p className="text-xs font-medium mb-2">Instruções:</p>
							<ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
								<li>Acesse o painel do seu provedor DNS</li>
								<li>Crie um novo registro TXT</li>
								<li>Nome/Host: @ ou {currentDomain.domain}</li>
								<li>Valor: cole o token acima</li>
								<li>Aguarde a propagação DNS (pode levar até 48h)</li>
							</ol>
						</div>
					</div>
				)}

				<DialogFooter>
					<Button
						onClick={() => onOpenChange(false)}
						variant="outline"
					>
						Cancelar
					</Button>
					{!currentDomain ? (
						<Button
							disabled={!newDomain.trim() || addMutation.isPending}
							onClick={() => addMutation.mutate({ domain: newDomain })}
						>
							{addMutation.isPending && (
								<Spinner className="size-4 mr-2" />
							)}
							Adicionar
						</Button>
					) : (
						<Button
							disabled={verifyMutation.isPending}
							onClick={handleVerify}
						>
							{verifyMutation.isPending && (
								<Spinner className="size-4 mr-2" />
							)}
							<CheckCircle2 className="size-4 mr-2" />
							Verificar agora
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
```

**Step 2: Verify it compiles**

Run: `bunx nx run web:typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/features/sso/ui/domain-verification-dialog.tsx
git commit -m "feat(sso): add domain verification dialog component"
```

---

### Task 18: Create Main SSO UI Component

**Files:**
- Create: `apps/web/src/features/sso/ui/organization-authentication.tsx`

**Step 1: Create main component**

```typescript
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Switch } from "@packages/ui/components/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@packages/ui/components/table";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import {
	CheckCircle2,
	Globe,
	Plus,
	Shield,
	Trash2,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc } from "@/integrations/orpc/client";
import { DomainVerificationDialog } from "./domain-verification-dialog";

type VerifiedDomain = {
	id: string;
	domain: string;
	verified: boolean;
	verifiedAt: Date | null;
	autoJoinEnabled: boolean;
	createdAt: Date;
};

function OrganizationAuthenticationSkeleton() {
	return (
		<div className="space-y-8">
			<div>
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-4 w-96 mt-1" />
			</div>
			<Skeleton className="h-[300px] w-full" />
		</div>
	);
}

function OrganizationAuthenticationErrorFallback({
	resetErrorBoundary,
}: FallbackProps) {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold font-serif">
					Autenticação e SSO
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Gerencie domínios verificados e configurações de SSO.
				</p>
			</div>
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<p className="text-sm text-muted-foreground mb-4">
					Não foi possível carregar as configurações de autenticação
				</p>
				<Button onClick={resetErrorBoundary} variant="outline">
					Tentar novamente
				</Button>
			</div>
		</div>
	);
}

function OrganizationAuthenticationContent() {
	const queryClient = useQueryClient();
	const { openAlertDialog } = useAlertDialog();
	const [domainDialogOpen, setDomainDialogOpen] = useState(false);

	const { data: domains } = useSuspenseQuery(
		orpc.sso.getDomains.queryOptions({}),
	);

	const removeMutation = useMutation(
		orpc.sso.removeDomain.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.sso.getDomains.queryOptions({}).queryKey,
				});
				toast.success("Domínio removido");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const toggleAutoJoinMutation = useMutation(
		orpc.sso.toggleAutoJoin.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.sso.getDomains.queryOptions({}).queryKey,
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	function handleRemoveDomain(domain: VerifiedDomain) {
		openAlertDialog({
			title: "Remover domínio",
			description: `Tem certeza que deseja remover ${domain.domain}? Esta ação não pode ser desfeita.`,
			actionLabel: "Remover",
			cancelLabel: "Cancelar",
			variant: "destructive",
			onAction: async () => {
				await removeMutation.mutateAsync({ domainId: domain.id });
			},
		});
	}

	function handleToggleAutoJoin(domain: VerifiedDomain, enabled: boolean) {
		toggleAutoJoinMutation.mutate({
			domainId: domain.id,
			enabled,
		});
	}

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-semibold font-serif">
					Autenticação e SSO
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Gerencie domínios verificados e configurações de SSO.
				</p>
			</div>

			{/* Verified Domains Section */}
			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-lg font-medium">Domínios verificados</h2>
						<p className="text-sm text-muted-foreground mt-1">
							Gerencie os domínios autorizados para autenticação
						</p>
					</div>
					<Button onClick={() => setDomainDialogOpen(true)} size="sm">
						<Plus className="size-4 mr-2" />
						Adicionar domínio
					</Button>
				</div>

				{domains.length === 0 ? (
					<div className="rounded-md border p-8 text-center">
						<Globe className="size-8 mx-auto text-muted-foreground mb-3" />
						<p className="text-sm font-medium mb-1">
							Nenhum domínio adicionado
						</p>
						<p className="text-xs text-muted-foreground">
							Adicione um domínio para começar a usar SSO
						</p>
					</div>
				) : (
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Domínio</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Auto-join</TableHead>
									<TableHead className="w-[100px]">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{domains.map((domain) => (
									<TableRow key={domain.id}>
										<TableCell className="font-medium">
											{domain.domain}
										</TableCell>
										<TableCell>
											{domain.verified ? (
												<Badge className="gap-1.5" variant="default">
													<CheckCircle2 className="size-3" />
													Verificado
												</Badge>
											) : (
												<Badge variant="outline">Pendente</Badge>
											)}
										</TableCell>
										<TableCell>
											<Switch
												checked={domain.autoJoinEnabled}
												disabled={
													!domain.verified ||
													toggleAutoJoinMutation.isPending
												}
												onCheckedChange={(enabled) =>
													handleToggleAutoJoin(domain, enabled)
												}
											/>
										</TableCell>
										<TableCell>
											<Button
												onClick={() => handleRemoveDomain(domain)}
												size="sm"
												variant="ghost"
											>
												<Trash2 className="size-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</section>

			{/* SSO Configuration Section */}
			<section className="space-y-3">
				<div>
					<h2 className="text-lg font-medium">Configurações de SSO</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Configure provedores de autenticação única (SSO)
					</p>
				</div>

				<ItemGroup>
					<Item variant="muted">
						<ItemMedia variant="icon">
							<Shield className="size-4" />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>SAML 2.0</ItemTitle>
							<ItemDescription>
								Configure autenticação via SAML para Okta, Azure AD, etc.
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<Button size="sm" variant="outline">
								Configurar
							</Button>
						</ItemActions>
					</Item>

					<Item variant="muted">
						<ItemMedia variant="icon">
							<Shield className="size-4" />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>OIDC / OAuth 2.0</ItemTitle>
							<ItemDescription>
								Configure autenticação via OpenID Connect
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<Button size="sm" variant="outline">
								Configurar
							</Button>
						</ItemActions>
					</Item>
				</ItemGroup>
			</section>

			<DomainVerificationDialog
				onOpenChange={setDomainDialogOpen}
				open={domainDialogOpen}
			/>
		</div>
	);
}

export function OrganizationAuthentication() {
	return (
		<ErrorBoundary
			FallbackComponent={OrganizationAuthenticationErrorFallback}
		>
			<Suspense fallback={<OrganizationAuthenticationSkeleton />}>
				<OrganizationAuthenticationContent />
			</Suspense>
		</ErrorBoundary>
	);
}
```

**Step 2: Verify it compiles**

Run: `bunx nx run web:typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/features/sso/ui/organization-authentication.tsx
git commit -m "feat(sso): add organization authentication UI component"
```

---

### Task 19: Update Authentication Page with Addon Gating

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/organization/authentication.tsx`

**Step 1: Replace with gated version**

Remove the preview component and replace with:

```typescript
import { ADDON_IDS } from "@packages/utils/addons";
import { Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useHasAddon } from "@/hooks/use-has-addon";
import { OrganizationAuthentication } from "@/features/sso/ui/organization-authentication";
import { SettingsAddonGatedPage } from "@/layout/dashboard/ui/settings-addon-gated-page";

export const Route = createFileRoute(
	"/_authenticated/$slug/$teamId/_dashboard/settings/organization/authentication",
)({
	component: OrgAuthenticationPage,
});

function AuthenticationPageContent() {
	const hasEnterprise = useHasAddon(ADDON_IDS.ENTERPRISE);

	if (hasEnterprise) {
		return <OrganizationAuthentication />;
	}

	return (
		<SettingsAddonGatedPage
			addonDescription="O addon Enterprise desbloqueia SSO e autenticação por domínio, permitindo integração com provedores como Okta, Azure AD e Google Workspace."
			addonName="Enterprise"
			description="SSO e autenticação empresarial."
			features={[
				{
					title: "SAML 2.0 e OIDC",
					description:
						"Integre com Okta, Azure AD, Google Workspace e outros provedores",
				},
				{
					title: "Domínios verificados",
					description:
						"Verifique domínios e permita auto-join para emails corporativos",
				},
				{
					title: "Autenticação forçada",
					description: "Exija SSO para todos os membros da organização",
				},
			]}
			icon={Globe}
			title="Autenticação e SSO"
		/>
	);
}

function OrgAuthenticationPage() {
	return (
		<Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
			<AuthenticationPageContent />
		</Suspense>
	);
}
```

**Step 2: Verify it compiles**

Run: `bunx nx run web:typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/organization/authentication.tsx
git commit -m "feat(sso): add addon gating to authentication page"
```

---

### Task 20: Final Verification and Documentation

**Files:**
- Create: `docs/addon-system.md`

**Step 1: Create addon system documentation**

```markdown
# Addon System

## Overview

The addon system allows organizations to unlock premium features by purchasing addons. There are three addon tiers:

- **Boost** (R$ 99/mês) - Access control
- **Scale** (R$ 199/mês) - Activity logs, advanced analytics
- **Enterprise** (Sob consulta) - Custom roles, SSO, SAML, OIDC

## Architecture

### Database Schema

- `organization_addons` - Tracks which addons an org has activated
- Feature-specific tables: `activity_logs`, `custom_roles`, `verified_domains`, `sso_configurations`

### Backend (oRPC)

- `organization.hasAddon` - Check if org has specific addon
- `organization.getAddons` - Get all active addons for org
- Feature routers: `activityLogs`, `roles`, `sso`

### Frontend

- `useHasAddon(addonId)` - Hook to check addon access
- `useAddons()` - Hook to get all addons with helpers
- `SettingsAddonGatedPage` - Component for addon landing pages
- Feature components conditionally rendered based on addon

## Adding New Addon-Gated Features

1. Add feature to addon constants (`packages/utils/src/addons.ts`)
2. Create feature database schema
3. Create feature oRPC router
4. Create feature UI component
5. Update settings page with conditional rendering:

```typescript
const hasAddon = useHasAddon(ADDON_IDS.YOUR_ADDON);

if (hasAddon) {
  return <YourFeatureComponent />;
}

return <SettingsAddonGatedPage ... />;
```

## Testing

To test addon-gated features in development:

1. Add test addon to database:
```sql
INSERT INTO organization_addons (organization_id, addon_id, activated_at)
VALUES ('your-org-id', 'boost', NOW());
```

2. Feature will unlock automatically
```

**Step 2: Run full typecheck**

Run: `bunx nx run web:typecheck`
Expected: All checks pass

**Step 3: Final commit**

```bash
git add docs/addon-system.md
git commit -m "docs: add addon system documentation"
```

---

## Execution Summary

**Plan complete!** This plan includes:

✅ **Phase 1**: Shared addon infrastructure (5 tasks)
✅ **Phase 2**: Activity Logs with Scale addon (4 tasks)
✅ **Phase 3**: Custom Roles with Enterprise addon (2 tasks)
✅ **Phase 4**: SSO/Authentication with Enterprise addon (5 tasks)

**Total: 20 tasks**, each taking 2-5 minutes to complete.

**Estimated total time:** 40-100 minutes for full implementation.

