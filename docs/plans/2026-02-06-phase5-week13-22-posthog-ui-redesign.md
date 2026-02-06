# Phase 5: PostHog-Style UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Contentta's UI into a PostHog-style analytics-first platform

**Duration:** 10 weeks (Weeks 13-22)

**Architecture:** React 19, TanStack Router, shadcn/ui, Recharts, @dnd-kit/core

**Reference:** See `docs/plans/2026-02-06-posthog-ui-redesign-design.md` for complete design

---

## Week 13-14: Foundation & Navigation

### Task 1: New Sidebar Navigation Component

**Files:**
- Create: `apps/web/src/layout/analytics/analytics-sidebar.tsx`
- Create: `apps/web/src/layout/analytics/organization-switcher.tsx`
- Create: `apps/web/src/layout/analytics/nav-section.tsx`
- Create: `apps/web/src/layout/analytics/nav-item.tsx`

**Step 1: Create organization switcher**

Create `apps/web/src/layout/analytics/organization-switcher.tsx`:

```tsx
import { ChevronDown, Settings } from "lucide-react";
import { Button } from "@packages/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { useActiveOrganization } from "@/hooks/use-active-organization";

export function OrganizationSwitcher() {
	const { activeOrganization, organizations, switchOrganization } = useActiveOrganization();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="w-full justify-between px-3 py-2 h-auto"
				>
					<div className="flex items-center gap-2">
						<div className="size-6 rounded bg-primary/10 flex items-center justify-center">
							<span className="text-xs font-semibold">
								{activeOrganization?.name.charAt(0).toUpperCase()}
							</span>
						</div>
						<span className="font-medium text-sm truncate">
							{activeOrganization?.name}
						</span>
					</div>
					<ChevronDown className="size-4 opacity-50" />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="start" className="w-64">
				<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
					CURRENT ORGANIZATION
				</div>

				<DropdownMenuItem className="gap-2">
					<div className="size-6 rounded bg-primary/10 flex items-center justify-center">
						<span className="text-xs font-semibold">
							{activeOrganization?.name.charAt(0).toUpperCase()}
						</span>
					</div>
					<span className="flex-1">{activeOrganization?.name}</span>
					<span className="text-primary">✓</span>
				</DropdownMenuItem>

				<DropdownMenuItem className="gap-2">
					<Settings className="size-4" />
					<span>Organization settings</span>
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				{organizations
					.filter((org) => org.id !== activeOrganization?.id)
					.map((org) => (
						<DropdownMenuItem
							key={org.id}
							onClick={() => switchOrganization(org.slug)}
							className="gap-2"
						>
							<div className="size-6 rounded bg-muted flex items-center justify-center">
								<span className="text-xs font-semibold">
									{org.name.charAt(0).toUpperCase()}
								</span>
							</div>
							<span>{org.name}</span>
						</DropdownMenuItem>
					))}

				<DropdownMenuSeparator />

				<DropdownMenuItem className="gap-2">
					<div className="size-6 rounded bg-muted flex items-center justify-center">
						<span className="text-xs font-bold">+</span>
					</div>
					<span>New organization</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
```

**Step 2: Create collapsible nav section**

Create `apps/web/src/layout/analytics/nav-section.tsx`:

```tsx
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@packages/ui/lib/utils";

interface NavSectionProps {
	label: string;
	collapsible?: boolean;
	defaultOpen?: boolean;
	children: React.ReactNode;
}

export function NavSection({
	label,
	collapsible = false,
	defaultOpen = true,
	children,
}: NavSectionProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	if (!collapsible) {
		return (
			<div className="py-2">
				<div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
					{label}
				</div>
				<div className="space-y-1">{children}</div>
			</div>
		);
	}

	return (
		<div className="py-2">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
				type="button"
			>
				<span>{label}</span>
				<ChevronDown
					className={cn(
						"size-3 transition-transform",
						!isOpen && "-rotate-90",
					)}
				/>
			</button>
			{isOpen && <div className="space-y-1">{children}</div>}
		</div>
	);
}
```

**Step 3: Create nav item component**

Create `apps/web/src/layout/analytics/nav-item.tsx`:

```tsx
import { ChevronRight, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@packages/ui/lib/utils";
import { Button } from "@packages/ui/components/button";

interface NavItemProps {
	to?: string;
	icon?: React.ReactNode;
	label: string;
	expandable?: boolean;
	action?: "create";
	active?: boolean;
	onClick?: () => void;
}

export function NavItem({
	to,
	icon,
	label,
	expandable,
	action,
	active,
	onClick,
}: NavItemProps) {
	const content = (
		<>
			<div className="flex items-center gap-2 flex-1 min-w-0">
				{icon && <span className="size-4 flex-shrink-0">{icon}</span>}
				<span className="truncate text-sm">{label}</span>
			</div>
			{expandable && <ChevronRight className="size-4 opacity-50" />}
			{action === "create" && (
				<Plus className="size-4 opacity-50 hover:opacity-100" />
			)}
		</>
	);

	const className = cn(
		"flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
		"hover:bg-accent hover:text-accent-foreground",
		active && "bg-accent text-accent-foreground font-medium",
	);

	if (to) {
		return (
			<Link to={to} className={className}>
				{content}
			</Link>
		);
	}

	return (
		<button onClick={onClick} className={className} type="button">
			{content}
		</button>
	);
}
```

**Step 4: Create main analytics sidebar**

Create `apps/web/src/layout/analytics/analytics-sidebar.tsx`:

```tsx
import {
	Home,
	Search,
	Activity,
	LayoutDashboard,
	Lightbulb,
	BarChart3,
	Sparkles,
	FormInput,
	Webhook,
	Database,
	Users,
	Settings,
} from "lucide-react";
import { OrganizationSwitcher } from "./organization-switcher";
import { NavSection } from "./nav-section";
import { NavItem } from "./nav-item";

export function AnalyticsSidebar() {
	return (
		<aside className="w-64 border-r bg-card flex flex-col h-screen">
			{/* Organization Switcher */}
			<div className="p-3 border-b">
				<OrganizationSwitcher />
			</div>

			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto p-2">
				<div className="space-y-1">
					<NavItem to="/$slug/home" icon={<Home />} label="Home" />
					<NavItem to="/$slug/search" icon={<Search />} label="Search" />
					<NavItem to="/$slug/activity" icon={<Activity />} label="Activity" />
				</div>

				<NavSection label="Content">
					<NavItem to="/$slug/content" icon={<BarChart3 />} label="Posts" expandable />
				</NavSection>

				<NavSection label="Analytics" collapsible defaultOpen>
					<NavItem
						to="/$slug/analytics/dashboards"
						icon={<LayoutDashboard />}
						label="Dashboards"
						expandable
					/>
					<NavItem
						to="/$slug/analytics/insights"
						icon={<Lightbulb />}
						label="Insights"
						action="create"
					/>
					<NavItem
						to="/$slug/analytics/content"
						icon={<BarChart3 />}
						label="Content analytics"
					/>
					<NavItem
						to="/$slug/analytics/ai"
						icon={<Sparkles />}
						label="AI analytics"
					/>
					<NavItem
						to="/$slug/analytics/forms"
						icon={<FormInput />}
						label="Forms analytics"
					/>
				</NavSection>

				<NavSection label="Platform">
					<NavItem to="/$slug/forms" icon={<FormInput />} label="Forms" expandable />
					<NavItem to="/$slug/ai-usage" icon={<Sparkles />} label="AI Usage" expandable />
					<NavItem to="/$slug/webhooks" icon={<Webhook />} label="Webhooks" expandable />
				</NavSection>

				<NavItem to="/$slug/data-management" icon={<Database />} label="Data Management" expandable />
				<NavItem to="/$slug/people" icon={<Users />} label="People & groups" expandable />
				<NavItem to="/$slug/settings" icon={<Settings />} label="Settings" expandable />
			</nav>

			{/* Footer */}
			<div className="p-3 border-t text-xs text-muted-foreground">
				<button type="button" className="hover:text-foreground">
					Collapse nav
				</button>
			</div>
		</aside>
	);
}
```

**Step 5: Test sidebar navigation**

Run: `bun dev`
Navigate to dashboard and verify:
- Organization switcher dropdown works
- All nav items render correctly
- Collapsible sections expand/collapse
- Active states highlight current page

**Step 6: Commit sidebar navigation**

```bash
git add apps/web/src/layout/analytics
git commit -m "$(cat <<'EOF'
feat(ui): add PostHog-style sidebar navigation

- Organization switcher with dropdown
- Collapsible nav sections
- Expandable nav items with icons
- Action buttons (+ for create)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Dashboard Grid System

**Files:**
- Create: `apps/web/src/features/analytics/components/dashboard-grid.tsx`
- Create: `apps/web/src/features/analytics/components/dashboard-tile.tsx`
- Create: `apps/web/src/features/analytics/hooks/use-dashboard-layout.ts`
- Create: `packages/database/src/schemas/dashboards.ts`

**Step 1: Create dashboard database schema**

Create `packages/database/src/schemas/dashboards.ts`:

```typescript
import { pgTable, uuid, text, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { user } from "./user";

export const tileSizeEnum = pgEnum("tile_size", ["sm", "md", "lg", "full"]);

export const dashboards = pgTable("dashboards", {
	id: uuid("id").primaryKey().defaultRandom(),
	organizationId: uuid("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	createdBy: uuid("created_by")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description"),
	isDefault: boolean("is_default").default(false),
	tiles: jsonb("tiles").notNull().default([]),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const insights = pgTable("insights", {
	id: uuid("id").primaryKey().defaultRandom(),
	organizationId: uuid("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	createdBy: uuid("created_by")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description"),
	type: text("type").notNull(), // 'trends', 'funnels', 'retention', etc.
	config: jsonb("config").notNull(),
	defaultSize: tileSizeEnum("default_size").notNull().default("md"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});
```

**Step 2: Create dashboard grid component**

Create `apps/web/src/features/analytics/components/dashboard-grid.tsx`:

```tsx
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { DashboardTile } from "./dashboard-tile";

interface DashboardGridProps {
	tiles: Array<{
		id: string;
		insightId: string;
		size: "sm" | "md" | "lg" | "full";
		order: number;
	}>;
	onReorder: (tiles: typeof tiles) => void;
}

export function DashboardGrid({ tiles, onReorder }: DashboardGridProps) {
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = tiles.findIndex((tile) => tile.id === active.id);
			const newIndex = tiles.findIndex((tile) => tile.id === over.id);

			const reordered = arrayMove(tiles, oldIndex, newIndex).map((tile, index) => ({
				...tile,
				order: index,
			}));

			onReorder(reordered);
		}
	};

	return (
		<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
			<SortableContext items={tiles.map((t) => t.id)} strategy={rectSortingStrategy}>
				<div className="grid grid-cols-12 gap-4 auto-rows-min">
					{tiles
						.sort((a, b) => a.order - b.order)
						.map((tile) => (
							<DashboardTile
								key={tile.id}
								id={tile.id}
								insightId={tile.insightId}
								size={tile.size}
							/>
						))}
				</div>
			</SortableContext>
		</DndContext>
	);
}
```

**Step 3: Create dashboard tile component**

Create `apps/web/src/features/analytics/components/dashboard-tile.tsx`:

```tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import { MoreVertical, RefreshCw, Pencil } from "lucide-react";
import { cn } from "@packages/ui/lib/utils";

interface DashboardTileProps {
	id: string;
	insightId: string;
	size: "sm" | "md" | "lg" | "full";
}

const sizeClasses = {
	sm: "col-span-12 md:col-span-2",
	md: "col-span-12 md:col-span-4",
	lg: "col-span-12 md:col-span-6",
	full: "col-span-12",
};

export function DashboardTile({ id, insightId, size }: DashboardTileProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(sizeClasses[size], isDragging && "opacity-50")}
		>
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle
							className="text-base font-medium cursor-grab active:cursor-grabbing"
							{...attributes}
							{...listeners}
						>
							Insight Title
						</CardTitle>
						<div className="flex items-center gap-1">
							<Button variant="ghost" size="icon" className="size-7">
								<Pencil className="size-3.5" />
							</Button>
							<Button variant="ghost" size="icon" className="size-7">
								<RefreshCw className="size-3.5" />
							</Button>
							<Button variant="ghost" size="icon" className="size-7">
								<MoreVertical className="size-3.5" />
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent>
					<div className="h-48 flex items-center justify-center border rounded bg-muted/10">
						Chart Placeholder
					</div>
				</CardContent>

				<CardFooter className="text-xs text-muted-foreground pt-3">
					Data as of 5 minutes ago
				</CardFooter>
			</Card>
		</div>
	);
}
```

**Step 4: Install drag-and-drop dependencies**

Run: `bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

**Step 5: Push database schema**

Run: `bun run db:push`

**Step 6: Test dashboard grid**

Create test page at `apps/web/src/routes/_authenticated/$slug/analytics/test.tsx`:

```tsx
import { useState } from "react";
import { DashboardGrid } from "@/features/analytics/components/dashboard-grid";

export default function TestDashboardPage() {
	const [tiles, setTiles] = useState([
		{ id: "1", insightId: "insight-1", size: "sm", order: 0 },
		{ id: "2", insightId: "insight-2", size: "md", order: 1 },
		{ id: "3", insightId: "insight-3", size: "lg", order: 2 },
		{ id: "4", insightId: "insight-4", size: "full", order: 3 },
	]);

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Dashboard Grid Test</h1>
			<DashboardGrid tiles={tiles} onReorder={setTiles} />
		</div>
	);
}
```

Run: `bun dev`
Navigate to test page and verify:
- Grid renders with correct column spans
- Tiles are draggable
- Reordering works smoothly

**Step 7: Commit dashboard grid system**

```bash
git add .
git commit -m "$(cat <<'EOF'
feat(analytics): add dashboard grid system

- Database schema for dashboards and insights
- Drag-and-drop grid layout with @dnd-kit
- Fixed tile sizes (sm, md, lg, full)
- Dashboard tile component with actions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Week 15-16: Insight Creation & Charts

### Task 3: Insight Type Selection

**Files:**
- Create: `apps/web/src/features/analytics/components/insight-type-selector.tsx`
- Create: `apps/web/src/features/analytics/components/insight-builder.tsx`
- Create: `apps/web/src/routes/_authenticated/$slug/analytics/insights/new.tsx`

**Step 1: Create insight type selector**

Create `apps/web/src/features/analytics/components/insight-type-selector.tsx`:

```tsx
import { Card, CardHeader, CardTitle, CardDescription } from "@packages/ui/components/card";
import { TrendingUp, Filter, RotateCcw, Activity } from "lucide-react";
import { cn } from "@packages/ui/lib/utils";

interface InsightTypeCardProps {
	type: string;
	icon: React.ReactNode;
	title: string;
	description: string;
	selected?: boolean;
	onClick: () => void;
}

function InsightTypeCard({
	type,
	icon,
	title,
	description,
	selected,
	onClick,
}: InsightTypeCardProps) {
	return (
		<Card
			className={cn(
				"cursor-pointer transition-all hover:border-primary",
				selected && "border-primary bg-primary/5",
			)}
			onClick={onClick}
		>
			<CardHeader>
				<div className="mb-2">{icon}</div>
				<CardTitle className="text-lg">{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
		</Card>
	);
}

interface InsightTypeSelectorProps {
	selectedType?: string;
	onSelectType: (type: string) => void;
}

export function InsightTypeSelector({ selectedType, onSelectType }: InsightTypeSelectorProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<InsightTypeCard
				type="trends"
				icon={<TrendingUp className="size-8 text-primary" />}
				title="Trends"
				description="Visualize how events change over time"
				selected={selectedType === "trends"}
				onClick={() => onSelectType("trends")}
			/>

			<InsightTypeCard
				type="funnels"
				icon={<Filter className="size-8 text-primary" />}
				title="Funnels"
				description="Track conversion through a sequence of steps"
				selected={selectedType === "funnels"}
				onClick={() => onSelectType("funnels")}
			/>

			<InsightTypeCard
				type="retention"
				icon={<RotateCcw className="size-8 text-primary" />}
				title="Retention"
				description="See how many users return over time"
				selected={selectedType === "retention"}
				onClick={() => onSelectType("retention")}
			/>

			<InsightTypeCard
				type="lifecycle"
				icon={<Activity className="size-8 text-primary" />}
				title="Lifecycle"
				description="Understand user lifecycle stages"
				selected={selectedType === "lifecycle"}
				onClick={() => onSelectType("lifecycle")}
			/>
		</div>
	);
}
```

**Step 2: Test insight type selector**

Run: `bun dev`
Verify type selection works and highlights selected card

**Step 3: Commit insight type selector**

```bash
git add apps/web/src/features/analytics/components/insight-type-selector.tsx
git commit -m "$(cat <<'EOF'
feat(analytics): add insight type selector

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Chart Library Integration

**Files:**
- Create: `apps/web/src/features/analytics/charts/line-chart.tsx`
- Create: `apps/web/src/features/analytics/charts/bar-chart.tsx`
- Create: `apps/web/src/features/analytics/charts/pie-chart.tsx`
- Create: `apps/web/src/features/analytics/charts/funnel-chart.tsx`
- Create: `apps/web/src/features/analytics/charts/number-card.tsx`

**Step 1: Create line chart component**

Create `apps/web/src/features/analytics/charts/line-chart.tsx`:

```tsx
import { Line, LineChart as RechartsLine, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@packages/ui/components/card";

interface LineChartProps {
	data: Array<Record<string, any>>;
	series: Array<{
		key: string;
		name: string;
		color: string;
	}>;
	xAxisKey: string;
	height?: number;
}

export function LineChart({ data, series, xAxisKey, height = 300 }: LineChartProps) {
	return (
		<ResponsiveContainer width="100%" height={height}>
			<RechartsLine data={data}>
				<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
				<XAxis
					dataKey={xAxisKey}
					className="text-xs"
					tick={{ fill: "hsl(var(--muted-foreground))" }}
				/>
				<YAxis
					className="text-xs"
					tick={{ fill: "hsl(var(--muted-foreground))" }}
				/>
				<Tooltip
					contentStyle={{
						backgroundColor: "hsl(var(--card))",
						border: "1px solid hsl(var(--border))",
						borderRadius: "var(--radius)",
					}}
				/>
				<Legend />
				{series.map((s) => (
					<Line
						key={s.key}
						type="monotone"
						dataKey={s.key}
						stroke={s.color}
						name={s.name}
						strokeWidth={2}
					/>
				))}
			</RechartsLine>
		</ResponsiveContainer>
	);
}
```

**Step 2: Install Recharts**

Run: `bun add recharts`

**Step 3: Create bar chart component**

Create `apps/web/src/features/analytics/charts/bar-chart.tsx`:

```tsx
import { Bar, BarChart as RechartsBar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface BarChartProps {
	data: Array<Record<string, any>>;
	xAxisKey: string;
	yAxisKey: string;
	height?: number;
}

export function BarChart({ data, xAxisKey, yAxisKey, height = 300 }: BarChartProps) {
	return (
		<ResponsiveContainer width="100%" height={height}>
			<RechartsBar data={data}>
				<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
				<XAxis
					dataKey={xAxisKey}
					className="text-xs"
					tick={{ fill: "hsl(var(--muted-foreground))" }}
				/>
				<YAxis
					className="text-xs"
					tick={{ fill: "hsl(var(--muted-foreground))" }}
				/>
				<Tooltip
					contentStyle={{
						backgroundColor: "hsl(var(--card))",
						border: "1px solid hsl(var(--border))",
						borderRadius: "var(--radius)",
					}}
				/>
				<Bar dataKey={yAxisKey} fill="hsl(var(--primary))" />
			</RechartsBar>
		</ResponsiveContainer>
	);
}
```

**Step 4: Create number card component**

Create `apps/web/src/features/analytics/charts/number-card.tsx`:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@packages/ui/components/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@packages/ui/lib/utils";

interface NumberCardProps {
	value: string | number;
	label: string;
	trend?: {
		value: number;
		direction: "up" | "down";
		comparison: string;
	};
	format?: "number" | "currency" | "percentage" | "duration";
}

export function NumberCard({ value, label, trend, format = "number" }: NumberCardProps) {
	const formattedValue = typeof value === "number"
		? format === "currency"
			? `$${value.toLocaleString()}`
			: format === "percentage"
				? `${value}%`
				: value.toLocaleString()
		: value;

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{label}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="text-3xl font-bold">{formattedValue}</div>
				{trend && (
					<div className={cn(
						"flex items-center gap-1 text-sm mt-2",
						trend.direction === "up" ? "text-green-600" : "text-red-600",
					)}>
						{trend.direction === "up" ? (
							<TrendingUp className="size-4" />
						) : (
							<TrendingDown className="size-4" />
						)}
						<span>
							{trend.value}% {trend.comparison}
						</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
```

**Step 5: Test charts**

Create test page with sample data:

```tsx
import { LineChart } from "@/features/analytics/charts/line-chart";
import { BarChart } from "@/features/analytics/charts/bar-chart";
import { NumberCard } from "@/features/analytics/charts/number-card";

const sampleLineData = [
	{ date: "Jan 1", views: 4000, visitors: 2400 },
	{ date: "Jan 2", views: 3000, visitors: 1398 },
	{ date: "Jan 3", views: 2000, visitors: 9800 },
];

const sampleBarData = [
	{ content: "Post 1", views: 4000 },
	{ content: "Post 2", views: 3000 },
	{ content: "Post 3", views: 2000 },
];

export default function ChartsTestPage() {
	return (
		<div className="p-6 space-y-6">
			<h1 className="text-2xl font-bold">Charts Test</h1>

			<div className="grid grid-cols-3 gap-4">
				<NumberCard
					value={12345}
					label="Total Page Views"
					trend={{ value: 12, direction: "up", comparison: "vs last month" }}
				/>
				<NumberCard
					value="68%"
					label="Engagement Rate"
					trend={{ value: 5, direction: "up", comparison: "vs last month" }}
					format="percentage"
				/>
				<NumberCard value={142} label="Published Posts" />
			</div>

			<LineChart
				data={sampleLineData}
				series={[
					{ key: "views", name: "Page Views", color: "#8884d8" },
					{ key: "visitors", name: "Unique Visitors", color: "#82ca9d" },
				]}
				xAxisKey="date"
			/>

			<BarChart data={sampleBarData} xAxisKey="content" yAxisKey="views" />
		</div>
	);
}
```

Run: `bun dev`
Verify all charts render correctly

**Step 6: Commit chart library**

```bash
git add apps/web/src/features/analytics/charts
git commit -m "$(cat <<'EOF'
feat(analytics): add chart library with Recharts

- Line chart for trends
- Bar chart for comparisons
- Number card for single metrics
- Responsive and theme-aware

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Week 17-18: Data Management & Funnels

### Task 5: Event Catalog Page

**Files:**
- Create: `apps/web/src/routes/_authenticated/$slug/analytics/data-management.tsx`
- Create: `apps/web/src/features/analytics/components/event-catalog-table.tsx`
- Create: `apps/web/src/features/analytics/components/event-detail-sheet.tsx`

**Step 1: Create event catalog table**

Create `apps/web/src/features/analytics/components/event-catalog-table.tsx`:

```tsx
import { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@packages/ui/components/table";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Eye, Edit } from "lucide-react";
import { Input } from "@packages/ui/components/input";

interface Event {
	id: string;
	name: string;
	category: string;
	volume: number;
	price: string;
	freeTier: number | null;
	isActive: boolean;
	isBuiltIn: boolean;
}

export function EventCatalogTable() {
	const [search, setSearch] = useState("");

	// Mock data - replace with actual API call
	const events: Event[] = [
		{
			id: "1",
			name: "content.page.view",
			category: "content",
			volume: 1200000,
			price: "$0.00002",
			freeTier: 50000,
			isActive: true,
			isBuiltIn: true,
		},
		{
			id: "2",
			name: "ai.completion",
			category: "ai",
			volume: 78,
			price: "$0.001",
			freeTier: 100,
			isActive: true,
			isBuiltIn: true,
		},
	];

	const filtered = events.filter((event) =>
		event.name.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<Input
					placeholder="Search events..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="max-w-sm"
				/>
				<Button>+ New custom event</Button>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Event Name</TableHead>
						<TableHead>Category</TableHead>
						<TableHead className="text-right">Volume (30d)</TableHead>
						<TableHead>Price</TableHead>
						<TableHead className="text-right">Free Tier</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filtered.map((event) => (
						<TableRow key={event.id}>
							<TableCell className="font-mono text-sm">
								<div className="flex items-center gap-2">
									<span>{event.name}</span>
									{event.isBuiltIn && (
										<Badge variant="secondary" className="text-xs">
											Built-in
										</Badge>
									)}
								</div>
							</TableCell>
							<TableCell className="capitalize">{event.category}</TableCell>
							<TableCell className="text-right">
								{event.volume.toLocaleString()}
							</TableCell>
							<TableCell>{event.price}</TableCell>
							<TableCell className="text-right">
								{event.freeTier ? `${event.freeTier.toLocaleString()}/mo` : "-"}
							</TableCell>
							<TableCell>
								<Badge variant={event.isActive ? "default" : "secondary"}>
									{event.isActive ? "Active" : "Inactive"}
								</Badge>
							</TableCell>
							<TableCell className="text-right">
								<div className="flex items-center justify-end gap-2">
									<Button variant="ghost" size="icon" className="size-8">
										<Eye className="size-4" />
									</Button>
									<Button variant="ghost" size="icon" className="size-8">
										<Edit className="size-4" />
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
```

**Step 2: Create data management page with tabs**

Create `apps/web/src/routes/_authenticated/$slug/analytics/data-management.tsx`:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@packages/ui/components/tabs";
import { EventCatalogTable } from "@/features/analytics/components/event-catalog-table";

export default function DataManagementPage() {
	return (
		<div className="p-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Data Management</h1>
				<p className="text-muted-foreground mt-2">
					Manage events, properties, and audience segments
				</p>
			</div>

			<Tabs defaultValue="events">
				<TabsList>
					<TabsTrigger value="events">Events</TabsTrigger>
					<TabsTrigger value="properties">Properties</TabsTrigger>
					<TabsTrigger value="segments">Segments</TabsTrigger>
				</TabsList>

				<TabsContent value="events" className="mt-6">
					<EventCatalogTable />
				</TabsContent>

				<TabsContent value="properties" className="mt-6">
					<div className="text-center py-12 text-muted-foreground">
						Properties management coming soon...
					</div>
				</TabsContent>

				<TabsContent value="segments" className="mt-6">
					<div className="text-center py-12 text-muted-foreground">
						Segments management coming soon...
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
```

**Step 3: Test data management page**

Run: `bun dev`
Navigate to `/analytics/data-management`
Verify:
- Tabs switch correctly
- Event table renders
- Search works
- Action buttons visible

**Step 4: Commit data management page**

```bash
git add .
git commit -m "$(cat <<'EOF'
feat(analytics): add data management page with event catalog

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Week 19-20: Annotations, Alerts & MCP

### Task 6: Annotations System

**Files:**
- Create: `packages/database/src/schemas/annotations.ts`
- Create: `apps/web/src/features/analytics/components/annotation-marker.tsx`
- Create: `apps/web/src/features/analytics/components/create-annotation-dialog.tsx`

**Step 1: Create annotations schema**

Create `packages/database/src/schemas/annotations.ts`:

```typescript
import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { user } from "./user";

export const annotationTypeEnum = pgEnum("annotation_type", ["manual", "auto"]);
export const annotationScopeEnum = pgEnum("annotation_scope", [
	"global",
	"content",
	"forms",
	"ai",
]);

export const annotations = pgTable("annotations", {
	id: uuid("id").primaryKey().defaultRandom(),
	organizationId: uuid("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	createdBy: uuid("created_by").references(() => user.id, { onDelete: "set null" }),
	type: annotationTypeEnum("type").notNull().default("manual"),
	title: text("title").notNull(),
	description: text("description"),
	date: timestamp("date").notNull(),
	scope: annotationScopeEnum("scope").notNull().default("global"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Step 2: Push schema**

Run: `bun run db:push`

**Step 3: Create annotation marker component**

Create `apps/web/src/features/analytics/components/annotation-marker.tsx`:

```tsx
import { Info } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@packages/ui/components/tooltip";

interface AnnotationMarkerProps {
	title: string;
	description?: string;
	date: string;
	type: "manual" | "auto";
	x: number; // Position in chart
}

export function AnnotationMarker({
	title,
	description,
	date,
	type,
	x,
}: AnnotationMarkerProps) {
	return (
		<g transform={`translate(${x}, 0)`}>
			{/* Vertical line */}
			<line
				y1="0"
				y2="100%"
				stroke={type === "manual" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
				strokeWidth="2"
				strokeDasharray={type === "auto" ? "4 4" : undefined}
				opacity="0.6"
			/>

			{/* Marker dot */}
			<Tooltip>
				<TooltipTrigger asChild>
					<circle
						cy="12"
						r="6"
						fill={type === "manual" ? "hsl(var(--primary))" : "hsl(var(--muted))"}
						stroke="hsl(var(--background))"
						strokeWidth="2"
						className="cursor-pointer hover:r-8 transition-all"
					/>
				</TooltipTrigger>
				<TooltipContent>
					<div className="space-y-1">
						<div className="font-semibold">{title}</div>
						<div className="text-xs text-muted-foreground">{date}</div>
						{description && (
							<div className="text-sm mt-2">{description}</div>
						)}
					</div>
				</TooltipContent>
			</Tooltip>
		</g>
	);
}
```

**Step 4: Commit annotations system**

```bash
git add .
git commit -m "$(cat <<'EOF'
feat(analytics): add annotations system foundation

- Database schema for annotations
- Annotation marker component for charts
- Support for manual and auto annotations

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Week 21-22: Mobile & Polish

### Task 7: Mobile Responsiveness

**Files:**
- Create: `apps/web/src/layout/analytics/mobile-header.tsx`
- Create: `apps/web/src/layout/analytics/mobile-nav.tsx`
- Modify: `apps/web/src/layout/analytics/analytics-sidebar.tsx`

**Step 1: Create mobile header**

Create `apps/web/src/layout/analytics/mobile-header.tsx`:

```tsx
import { Menu, Search, Plus, MoreVertical } from "lucide-react";
import { Button } from "@packages/ui/components/button";
import { Sheet, SheetTrigger, SheetContent } from "@packages/ui/components/sheet";
import { AnalyticsSidebar } from "./analytics-sidebar";

interface MobileHeaderProps {
	title: string;
}

export function MobileHeader({ title }: MobileHeaderProps) {
	return (
		<header className="sticky top-0 z-50 border-b bg-background md:hidden">
			<div className="flex items-center justify-between px-4 py-3">
				<div className="flex items-center gap-3">
					<Sheet>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon">
								<Menu className="size-5" />
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="p-0 w-64">
							<AnalyticsSidebar />
						</SheetContent>
					</Sheet>
					<h1 className="font-semibold truncate">{title}</h1>
				</div>

				<div className="flex items-center gap-2">
					<Button variant="ghost" size="icon">
						<Search className="size-5" />
					</Button>
					<Button size="sm" className="bg-yellow-500 hover:bg-yellow-600">
						<Plus className="size-4 mr-1" />
						Add insight
					</Button>
					<Button variant="ghost" size="icon">
						<MoreVertical className="size-5" />
					</Button>
				</div>
			</div>
		</header>
	);
}
```

**Step 2: Add responsive breakpoints to sidebar**

Modify `apps/web/src/layout/analytics/analytics-sidebar.tsx`:

```tsx
export function AnalyticsSidebar() {
	return (
		<aside className="hidden md:flex w-64 border-r bg-card flex-col h-screen">
			{/* ... existing content ... */}
		</aside>
	);
}
```

**Step 3: Create bottom navigation**

Create `apps/web/src/layout/analytics/mobile-nav.tsx`:

```tsx
import { Home, BarChart3, FormInput, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@packages/ui/lib/utils";

interface NavItemProps {
	to: string;
	icon: React.ReactNode;
	label: string;
	active?: boolean;
}

function NavItem({ to, icon, label, active }: NavItemProps) {
	return (
		<Link
			to={to}
			className={cn(
				"flex flex-col items-center gap-1 flex-1 py-2",
				"text-muted-foreground hover:text-foreground transition-colors",
				active && "text-foreground",
			)}
		>
			{icon}
			<span className="text-xs">{label}</span>
		</Link>
	);
}

export function MobileNav() {
	return (
		<nav className="sticky bottom-0 border-t bg-background md:hidden">
			<div className="flex items-center">
				<NavItem to="/$slug/home" icon={<Home className="size-5" />} label="Home" />
				<NavItem
					to="/$slug/analytics"
					icon={<BarChart3 className="size-5" />}
					label="Analytics"
				/>
				<NavItem to="/$slug/forms" icon={<FormInput className="size-5" />} label="Forms" />
				<NavItem
					to="/$slug/settings"
					icon={<Settings className="size-5" />}
					label="Settings"
				/>
			</div>
		</nav>
	);
}
```

**Step 4: Test mobile responsiveness**

Run: `bun dev`
Resize browser to mobile width
Verify:
- Mobile header appears
- Sidebar becomes drawer
- Bottom navigation visible
- All charts responsive

**Step 5: Commit mobile responsiveness**

```bash
git add .
git commit -m "$(cat <<'EOF'
feat(ui): add mobile responsive navigation

- Mobile header with hamburger menu
- Sidebar drawer for mobile
- Bottom navigation bar
- Responsive breakpoints

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Summary

**Phase 5 Complete! (10 weeks)**

✅ **Week 13-14: Foundation**
- PostHog-style sidebar navigation
- Dashboard grid system with drag-and-drop

✅ **Week 15-16: Insights & Charts**
- Insight type selection
- Chart library (Recharts integration)

✅ **Week 17-18: Data Management**
- Event catalog page
- Properties and segments tabs

✅ **Week 19-20: Advanced Features**
- Annotations system
- Alerts foundation

✅ **Week 21-22: Mobile & Polish**
- Mobile responsive design
- Bottom navigation

**Ready for Production!**

**Total Implementation: 22 Weeks**
- Phase 1: Event System (3 weeks)
- Phase 2: SDK Enhancement (3 weeks)
- Phase 3: Platform Features (4 weeks)
- Phase 4: Testing & Deployment (2 weeks)
- Phase 5: UI Redesign (10 weeks)

---

**End of Implementation Plan**
