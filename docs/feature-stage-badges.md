# Feature Stage Badges

Standardized badge components for displaying feature development stages (Alpha, Beta, Concept, etc.).

## Components

### FeatureStageBadge

A standardized badge component that displays feature development stages with consistent styling and icons.

**Location:** `@packages/ui/components/feature-stage-badge`

**Props:**
- `stage` (required): The feature stage - `"alpha" | "beta" | "concept" | "experimental" | "preview"`
- `showIcon` (optional, default: `true`): Whether to show the icon
- All other props from the base `Badge` component

**Available Stages:**

| Stage | Icon | Label | Color |
|-------|------|-------|-------|
| `alpha` | Sparkles ✨ | Alpha | Orange |
| `beta` | FlaskConical 🧪 | Beta | Blue |
| `concept` | Lightbulb 💡 | Conceito | Purple |
| `experimental` | FlaskConical 🧪 | Experimental | Amber |
| `preview` | FlaskConical 🧪 | Preview | Cyan |

### Usage Examples

```tsx
import { FeatureStageBadge } from "@packages/ui/components/feature-stage-badge";

// Basic usage
<FeatureStageBadge stage="beta" />

// Without icon
<FeatureStageBadge stage="alpha" showIcon={false} />

// With custom className
<FeatureStageBadge
  stage="concept"
  className="ml-2"
/>

// In a navigation item
<SidebarMenuButton>
  <Icon />
  <span>New Feature</span>
  <FeatureStageBadge
    stage="beta"
    className="ml-1.5 group-data-[collapsible=icon]:hidden"
  />
</SidebarMenuButton>

// In a list item
<ItemContent>
  <div className="flex items-center gap-2">
    <ItemTitle>Feature Name</ItemTitle>
    <FeatureStageBadge stage={feature.stage} />
  </div>
  <ItemDescription>
    Feature description...
  </ItemDescription>
</ItemContent>
```

## SSR Early Access Features

Server-side utilities for checking early access feature enrollment using PostHog.

**Location:** `@packages/posthog/early-access-ssr`

### Functions

#### `isEnrolledInFeatureSSR`

Check if a user is enrolled in a specific early access feature on the server.

```typescript
import { isEnrolledInFeatureSSR } from "@packages/posthog/early-access-ssr";
import type { FeatureFlagContext } from "@packages/posthog/server";

const context: FeatureFlagContext = {
  userId: "user-123",
  userProperties: { email: "user@example.com" },
  groups: { organization: "org-456" },
};

const isEnrolled = await isEnrolledInFeatureSSR(
  posthog,
  "analytics-v2-beta",
  context
);

if (isEnrolled) {
  // Show beta feature
}
```

#### `getEnrolledFeaturesSSR`

Get all enrolled early access features for a user.

```typescript
import { getEnrolledFeaturesSSR } from "@packages/posthog/early-access-ssr";

const featureFlags = [
  "analytics-v2-beta",
  "forms-builder-alpha",
  "ai-content-preview"
];

const enrolledFeatures = await getEnrolledFeaturesSSR(
  posthog,
  featureFlags,
  context
);

// Returns Set<string> of enrolled flag keys
console.log(enrolledFeatures.has("analytics-v2-beta")); // true/false
```

### Usage in oRPC Procedures

```typescript
import { protectedProcedure } from "../server";
import { isEnrolledInFeatureSSR } from "@packages/posthog/early-access-ssr";

export const getData = protectedProcedure
  .input(z.object({ includePreview: z.boolean().optional() }))
  .handler(async ({ context, input }) => {
    const { posthog, userId, organizationId } = context;

    // Check if user has access to preview features
    const hasPreviewAccess = posthog
      ? await isEnrolledInFeatureSSR(
          posthog,
          "data-preview-beta",
          {
            userId,
            groups: { organization: organizationId },
          }
        )
      : false;

    // Return data based on enrollment
    if (hasPreviewAccess && input.includePreview) {
      return { data: [...baseData, ...previewData] };
    }

    return { data: baseData };
  });
```

### Usage in TanStack Router Loaders

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { isEnrolledInFeatureSSR } from "@packages/posthog/early-access-ssr";
import { getElysiaPosthogConfig } from "@packages/posthog/server";
import { serverEnv } from "@packages/environment/server";

export const Route = createFileRoute("/_authenticated/$slug/beta-feature")({
  loader: async ({ context }) => {
    const posthog = getElysiaPosthogConfig(serverEnv);
    const { userId, organizationId } = context;

    const hasAccess = await isEnrolledInFeatureSSR(
      posthog,
      "beta-feature-flag",
      {
        userId,
        groups: { organization: organizationId },
      }
    );

    if (!hasAccess) {
      throw redirect({ to: "/$slug/dashboard" });
    }

    return { hasAccess };
  },
  component: BetaFeaturePage,
});
```

## Client-Side Usage

For client-side feature flag checks, use the existing hooks:

```tsx
import { useEarlyAccess } from "@/hooks/use-early-access";
import { FeatureStageBadge } from "@packages/ui/components/feature-stage-badge";

function MyComponent() {
  const { features, isEnrolled, updateEnrollment } = useEarlyAccess();

  return (
    <>
      {features.map((feature) => (
        <div key={feature.flagKey}>
          <div className="flex items-center gap-2">
            <span>{feature.name}</span>
            <FeatureStageBadge stage={feature.stage} />
          </div>

          {feature.flagKey && (
            <Switch
              checked={isEnrolled(feature.flagKey)}
              onCheckedChange={(checked) =>
                updateEnrollment(feature.flagKey!, checked)
              }
            />
          )}
        </div>
      ))}
    </>
  );
}
```

## Best Practices

1. **Use SSR for initial page loads** - Check feature flags on the server to avoid content flashing
2. **Use client-side hooks for interactive toggles** - Let users opt-in/out of beta features
3. **Always provide fallbacks** - Handle cases where PostHog is unavailable or feature flags fail
4. **Consistent staging** - Use the standardized `FeatureStageBadge` across the app for visual consistency
5. **Clear labeling** - Always show feature stage badges for beta/alpha features in navigation

## Migration Guide

If you have existing beta badges, replace them with `FeatureStageBadge`:

```tsx
// Before
<Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
  <FlaskConical className="size-3 mr-1" />
  Beta
</Badge>

// After
<FeatureStageBadge stage="beta" className="ml-1.5" />
```
