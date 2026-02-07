# Scope Switcher Design (Org + Project)

## Overview
Contentta will mirror the PostHog model: projects/teams are the operational scope for all product features, while the organization is the billing and admin scope. The sidebar header will expose two distinct switchers: org and project.

## Goals
- Make project/team scope the default for all product workflows.
- Keep org scope for billing and org-level admin.
- Provide fast, clear switching in the sidebar header (dual triggers).
- Preserve user context on project switch when possible.

## Non-goals
- No feature flag rollout (ship as default).
- No cross-project aggregated views in this iteration.

## UX and Interaction
- Sidebar header has two click targets:
  - Org icon opens org switcher popover.
  - Project name opens project switcher popover.
- Clear separation between the targets (spacing or subtle divider).
- Org switcher popover:
  - Search/filter
  - Current org and other orgs with role badges
  - Links to org settings and billing
- Project switcher popover:
  - Search/filter
  - Current project and other projects in org
  - "New project" action at bottom
- Org-only pages (billing, org settings) show a small "Org-only" context badge in the page header to reduce confusion.

## Architecture and Components
- `SidebarScopeHeader` composes two triggers and manages anchoring popovers.
- `OrgSwitcherPopover` and `ProjectSwitcherPopover` share a `SwitcherList` UI pattern:
  - Current section, other section, divider, action footer
- Scope state is stored in a small client store (TanStack Store or equivalent) and hydrated from URL, persisted preference, or server defaults.

## Data Flow
- Resolve active org and project on boot in this order:
  1. URL params (if present)
  2. Persisted preference
  3. Server defaults
- Project-scoped data hooks require `projectId`.
- Org-only data hooks require `orgId` only.
- Switching org refreshes project list; invalid project is replaced with first accessible project.

## Permissions
- Org membership gates org switcher options and org-only pages.
- Project membership gates project list and project-scoped routes.
- Admin/owner roles can see project manage actions.

## Routing Rules
- Project-scoped routes: require `projectId` and stay on route when switching project.
- Org-only routes: do not require `projectId` and ignore project switching.
- If a project is missing or inaccessible, fall back to first accessible project or redirect to project creation.

## Error Handling
- If `projectId` is invalid or access is lost:
  - Show toast explaining the change.
  - Auto-resolve to a valid project or org-only CTA.
- API returns `NOT_FOUND` or `FORBIDDEN` for invalid scope; client handles by auto-resolving scope.

## Testing
- Unit tests for scope resolution precedence and fallback.
- Integration tests for org switch, project switch, and org-only routes.
- API tests for enforcing org/project pairing and missing project errors.

## Rollout
- Ship as default (no feature flag).
- Add a short in-app note on first use explaining project scope vs org billing.

## Analytics
- Track events: org switch, project switch, scope not found, and fallback resolution.
