# PostHog-Style Analytics UI Redesign - Design Document

**Date:** 2026-02-06
**Status:** Approved
**Goal:** Transform Contentta's UI to match PostHog's analytics-first experience while maintaining current theme

---

## Executive Summary

Redesign Contentta's entire interface to adopt PostHog's analytics-first approach with custom dashboards, insights, funnels, retention analysis, and full event exploration capabilities. This redesign focuses on making analytics accessible throughout the application while providing a powerful central analytics hub.

**Key Principles:**
1. **Analytics everywhere** - Contextual analytics embedded in every section
2. **PostHog component patterns** - Use exact PostHog UI patterns adapted for CMS
3. **Current theme maintained** - Keep existing colors/branding, adopt structure only
4. **Fully responsive** - Enhanced mobile experience beyond PostHog's current design

---

## Architecture Overview

### Navigation Structure

```
┌─────────────────────────────┐
│ [Org Icon] Organization ▼ ⚙ │ ← Switcher + settings
├─────────────────────────────┤
│ 🏠 Home                      │ ← Customizable dashboard
│ 🔍 Search                    │
│ 📊 Activity                  │
│                              │
│ Content                      │ ← Section header
│ 📝 Posts                  ▶  │
│ ✍️  Editor                ▶  │
│                              │
│ Analytics                 ⊙  │ ← Collapsible section
│ 📊 Dashboards             ▼  │
│ 💡 Insights               +  │
│ 📈 Content analytics         │
│ 🤖 AI analytics              │
│ 📋 Forms analytics           │
│                              │
│ Platform                     │
│ 📋 Forms                  ▶  │
│ 🤖 AI Usage               ▶  │
│ 🔗 Webhooks               ▶  │
│                              │
│ Data Management           ▶  │
│ 👥 People & groups        ▶  │
│                              │
│ ⚙️  Settings              ▶  │
└─────────────────────────────┘
```

### Core Pages

**1. Home (Customizable Dashboard)**
- Default tiles for new users
- Fully customizable (add/remove/reorder insights)
- Organization-scoped customization

**2. Analytics Hub**
- `/analytics/dashboards` - Dashboard library
- `/analytics/insights` - Saved insights library
- `/analytics/data-management` - Event catalog, properties, segments

**3. Contextual Analytics**
- Content section → Analytics tab
- Forms section → Analytics tab
- AI Usage section → Analytics tab

---

## Component System

### 1. Sidebar Navigation

**Organization Switcher:**
```tsx
<SidebarHeader>
  <OrganizationSwitcher>
    <OrganizationIcon />
    <OrganizationName>{currentOrg.name}</OrganizationName>
    <ChevronDown />
  </OrganizationSwitcher>

  <OrganizationDropdown>
    <CurrentOrgSection>
      <OrgItem selected>{currentOrg.name} ✓</OrgItem>
      <OrgSettingsButton />
    </CurrentOrgSection>
    <Separator />
    <OtherOrgs />
    <Separator />
    <CreateNewOrg>+ New organization</CreateNewOrg>
  </OrganizationDropdown>
</SidebarHeader>
```

**Navigation Items:**
- Single items (Home, Search, Activity)
- Expandable items (▶) with sub-menus
- Collapsible sections (Analytics, Platform)
- Action icons (+ for create, ⚙ for settings)
- Active state highlighting

### 2. Dashboard System

**Fixed-Size Tile System:**
- **Small** (2 columns): Number cards, pie charts
- **Medium** (4 columns): Line/bar charts, tables
- **Large** (6 columns): Wide tables, complex funnels
- **Full width** (12 columns): Retention grids

**Tile Layout:**
- Drag-and-drop reordering only (no manual resize)
- Auto-reflow on screen size changes
- Consistent padding and spacing

**Dashboard Header:**
```tsx
<DashboardHeader>
  <DashboardTitle editable>{dashboard.name}</DashboardTitle>
  <DashboardActions>
    <DateRangePicker />
    <RefreshButton>Last updated: 5 min ago</RefreshButton>
    <ShareButton />
    <AddInsightButton>+ Add insight</AddInsightButton>
    <MoreMenu>
      <MenuItem>Duplicate</MenuItem>
      <MenuItem>Export PDF</MenuItem>
      <MenuItem>Delete</MenuItem>
    </MoreMenu>
  </DashboardActions>
</DashboardHeader>
```

### 3. Insight Creation Flow

**Step 1: Choose Insight Type**
- Trends (line/bar/area charts)
- Funnels (conversion steps)
- Retention (cohort analysis)
- Lifecycle (user stages)

**Step 2: Configure (Side-by-side with live preview)**
- Event selection (multi-series)
- Property filters (AND/OR logic)
- Breakdown by property
- Chart type picker
- Date range selector

**Step 3: Save**
- Name and description
- Add to dashboard (optional)
- Auto-save to drafts

**Key Features:**
- Live preview updates as you configure
- Debounced queries (500ms)
- Query loading states
- Empty state handling

### 4. Chart Types

**PostHog Standard Charts:**
1. **Line Chart** - Trends over time
2. **Bar Chart** - Compare values
3. **Area Chart** - Stacked trends
4. **Pie Chart** - Distribution
5. **Donut Chart** - Distribution with center metric
6. **Number Display** - Single metric with trend
7. **Table View** - Data grid
8. **Funnel Chart** - Conversion steps
9. **Retention Grid** - Cohort heatmap
10. **World Map** - Geographic distribution
11. **Stacked Bar** - Multiple metrics comparison

**CMS-Specific Charts:**
12. **Content Heatmap** - Performance by day/time
13. **Engagement Timeline** - Content lifecycle events
14. **Scroll Depth Visualization** - Reader drop-off points

**Implementation:**
- Use **shadcn/ui charts** (built on Recharts)
- Responsive design (adjust data density on mobile)
- Interactive tooltips
- Click to drill down
- Export as PNG/SVG

### 5. Data Management

**Three Tabs:**

**Events Tab:**
- Event catalog table (name, category, volume, price, free tier)
- Search and filter
- Create custom events
- Event detail side sheet with properties

**Properties Tab:**
- All event properties (including nested JSON paths)
- Filter by scope (event, user, custom)
- Property usage tracking
- Example values display

**Segments Tab:**
- Audience segment cards
- Segment definition with filter builder
- Live size estimation
- Export capabilities

### 6. Funnel Visualization

```tsx
<FunnelVisualization>
  <StepsBuilder>
    {steps.map((step, index) => (
      <StepRow>
        <StepNumber>{index + 1}</StepNumber>
        <EventPicker />
        <FilterButton />
      </StepRow>
    ))}
    <AddStepButton>+ Add step</AddStepButton>
  </StepsBuilder>

  <FunnelSettings>
    <ConversionWindow />
    <BreakdownProperty />
  </FunnelSettings>

  <FunnelChart>
    {/* Horizontal bars showing drop-off between steps */}
  </FunnelChart>

  <FunnelSummary>
    <OverallConversionRate />
    <MedianTimeToConvert />
    <TotalConversions />
  </FunnelSummary>
</FunnelVisualization>
```

### 7. Retention Grid

```tsx
<RetentionVisualization>
  <RetentionConfig>
    <CohortAction />
    <ReturnAction />
    <CohortPeriod />
    <RetentionType />
  </RetentionConfig>

  <RetentionGrid>
    {/* Heatmap-style grid */}
    {/* Color coding: 80-100% dark green, 60-80% medium green, etc. */}
  </RetentionGrid>

  <RetentionSummary>
    <AvgDay7Retention />
    <BestCohort />
  </RetentionSummary>
</RetentionVisualization>
```

### 8. Annotations System

**Auto-Annotations** (triggered by events):
- Content published → "Published: {title}"
- Form activated → "Form '{name}' went live"
- AI agent updated → "Updated AI agent: {name}"
- Webhook created → "Webhook endpoint added"

**Manual Annotations:**
- User-created timeline markers
- Scoped to specific analytics sections or global
- Displayed as vertical lines on charts with tooltips

**Annotation Management:**
- List view with search/filter
- Create, edit, delete
- Click on chart annotation to view details

### 9. Alerts System

**Threshold Alerts:**
- Event count exceeds/drops below value
- Percentage increase/decrease
- Timeframe (hour, day, week)
- Notification channels (email, in-app, webhook)

**Anomaly Detection:**
- AI-powered pattern recognition
- Learn normal baselines
- Configurable sensitivity
- Automatic spike/drop detection

**Alert Management:**
- Active alerts list
- Triggered alerts with current vs expected values
- Snooze and dismiss actions
- Alert history

### 10. Contextual Analytics

**Content Section - Analytics Tab:**
- Quick stats cards (total views, avg engagement, published count)
- Top performing content (bar chart)
- Engagement over time (line chart)
- Content performance table

**Forms Section - Analytics Tab:**
- Quick stats cards (submissions, conversion rate, active forms)
- Form conversion funnel
- Field-level error rates
- Submission trends

**AI Usage Section - Analytics Tab:**
- Quick stats cards (operations, total cost, most used)
- AI operations by type (pie chart)
- Usage trends (stacked area chart)
- Agent performance table

**Common Features:**
- "View in Analytics →" buttons linking to full insights
- Embedded insights use same components as standalone
- Respect global date range filter
- Export capabilities

---

## Mobile Responsiveness

### Enhanced PostHog Mobile Design

**Header:**
```tsx
<MobileHeader>
  <MenuButton>☰</MenuButton>
  <PageTitle>Content Analytics</PageTitle>
  <QuickActions>
    <IconButton>🔍</IconButton>
    <IconButton highlighted>+ Add insight</IconButton>
    <IconButton>⋮</IconButton>
  </QuickActions>
</MobileHeader>
```

**Filter Bar** (sticky, horizontal scroll):
```tsx
<FilterBar sticky>
  <FilterChip>📅 Last 30 days</FilterChip>
  <FilterChip>+ Filter</FilterChip>
  <FilterChip>+ Breakdown</FilterChip>
  <RefreshIndicator>Last refreshed 5 min ago</RefreshIndicator>
</FilterBar>
```

**Insight Cards** (full-width stack):
```tsx
<InsightCard>
  <CardHeader>
    <MetaLabel>TRENDS • LAST 30 DAYS</MetaLabel>
    <CardActions />
  </CardHeader>
  <CardTitle>Page Views by Content</CardTitle>
  <CardDescription>Top performing content</CardDescription>
  <MetricTags>
    <Tag>content.page.view</Tag>
  </MetricTags>
  <ChartContainer height={280}>
    <Chart responsive touchOptimized />
  </ChartContainer>
  <ChartLegend />
</InsightCard>
```

**Enhanced Mobile Features:**
1. **Pull-to-Refresh** - Refresh dashboards/insights
2. **Collapsible Sections** - Tap header to expand/collapse cards
3. **Bottom Navigation** - Quick access (Home, Analytics, Forms, Settings)
4. **Swipe Gestures** - Swipe cards for edit/delete actions
5. **Floating Action Button** - Create new insight/dashboard
6. **Optimized Touch Targets** - Minimum 44px tap areas
7. **Responsive Charts** - Simplified data density, enlarged tooltips

**Breakpoints:**
- Mobile: < 640px (single column, bottom nav, drawer sidebar)
- Tablet: 640-1024px (2-column grid, drawer sidebar)
- Desktop: > 1024px (multi-column, fixed sidebar)

---

## MCP Integration

### MCP Tools (27 tools across 7 categories)

**1. Insights Tools (6):**
- `query_trends` - Query event trends
- `create_insight` - Create and save insight
- `update_insight` - Modify insight
- `delete_insight` - Remove insight
- `list_insights` - Get all insights
- `get_insight` - Get insight details

**2. Dashboard Tools (6):**
- `create_dashboard` - Create dashboard
- `update_dashboard` - Modify dashboard
- `delete_dashboard` - Remove dashboard
- `list_dashboards` - Get all dashboards
- `add_insight_to_dashboard` - Add tile
- `remove_insight_from_dashboard` - Remove tile

**3. Events Tools (4):**
- `query_events` - Query raw event data
- `list_event_types` - Get event catalog
- `create_custom_event` - Define custom event
- `get_event_properties` - Get event properties

**4. Segments Tools (4):**
- `create_segment` - Create audience segment
- `update_segment` - Modify segment
- `list_segments` - Get all segments
- `get_segment_size` - Get current size

**5. Annotations Tools (3):**
- `create_annotation` - Add timeline marker
- `list_annotations` - Get all annotations
- `delete_annotation` - Remove annotation

**6. Workspace Tools (3):**
- `get_organization` - Get org details
- `list_projects` - List projects
- `get_usage_stats` - Get billing/usage

**7. Docs Tools (1):**
- `search_docs` - Search documentation

**Authentication:**
- API key via environment variable or config
- Validates against database API keys table
- Organization-scoped access

---

## Global Search

**Command Palette** (⌘K / Ctrl+K):

```tsx
<CommandPalette>
  <SearchInput placeholder="Search dashboards, insights, events..." />

  <SearchResults>
    <ResultSection title="Dashboards">
      <ResultItem icon="📊">Content Performance</ResultItem>
    </ResultSection>

    <ResultSection title="Insights">
      <ResultItem icon="💡">Page views by content</ResultItem>
    </ResultSection>

    <ResultSection title="Events">
      <ResultItem icon="⚡">content.page.view</ResultItem>
    </ResultSection>

    <ResultSection title="Quick Actions">
      <ResultItem icon="+">Create new insight</ResultItem>
      <ResultItem icon="+">Create new dashboard</ResultItem>
    </ResultSection>
  </SearchResults>
</CommandPalette>
```

**Search Capabilities:**
- Fuzzy matching
- Keyboard navigation (arrows, enter)
- Recent searches
- Quick actions
- Deep links to results

---

## Activity Feed

**Activity Timeline:**

```tsx
<ActivityPage>
  <ActivityFilters>
    <FilterChip>All activity</FilterChip>
    <FilterChip>Insights only</FilterChip>
    <FilterChip>Dashboards only</FilterChip>
    <FilterChip>My activity</FilterChip>
  </ActivityFilters>

  <ActivityTimeline>
    <ActivityItem type="insight">
      <Actor>John Doe</Actor>
      <Action>created insight</Action>
      <Target>"Page views by device"</Target>
      <Timestamp>2 hours ago</Timestamp>
    </ActivityItem>

    <ActivityItem type="alert">
      <Alert>Alert triggered:</Alert>
      <Target>"Page views dropped 50%"</Target>
      <Timestamp>1 day ago</Timestamp>
    </ActivityItem>
  </ActivityTimeline>
</ActivityPage>
```

**Activity Types:**
- Insight created/updated/deleted
- Dashboard created/updated/deleted
- Alert triggered
- Segment created
- Annotation added
- Export completed

---

## Dashboard Templates

**Topic-Based Templates:**
1. **Content Performance** - Top content, engagement, scroll depth
2. **AI Usage Overview** - Operations, costs, agent performance
3. **Forms Analytics** - Conversions, submissions, field errors
4. **Reader Engagement** - Retention, return visits, time spent
5. **Conversion Tracking** - CTA clicks, funnel analysis
6. **SEO Performance** - Indexed pages, organic traffic

**Role-Based Templates:**
1. **Content Creator** - Writing metrics, AI usage, content drafts
2. **Marketer** - Engagement, conversions, ROI, campaigns
3. **Executive** - High-level KPIs, revenue, growth metrics

**Template Features:**
- One-click apply
- Customizable after creation
- Save custom templates
- Share templates within organization

---

## Data Freshness

**Materialized Views** (hourly refresh):
- Query materialized views for performance
- Show "Data as of X minutes ago" indicator
- Accept 1-hour delay for historical data
- Last hour queries raw events table (hybrid approach possible in future)

**Refresh Strategy:**
- Hourly cron job refreshes all materialized views
- Concurrent refresh to minimize lock time
- Manual refresh button for admins

---

## Export Capabilities

**Insight Data Export:**
- CSV format (data only)
- JSON format (data + config)
- Export button on each insight

**Dashboard Export:**
- PDF report with all charts
- Include date range and filters
- Branded with organization logo

**Features:**
- Async export for large datasets
- Download link via email
- Export history tracking

---

## Saved Filters & Segments

**Saved Filters:**
- Save commonly used filter combinations
- Apply to any insight
- Organization-wide or personal
- Examples: "Mobile traffic only", "Published content only"

**Audience Segments:**
- Define user cohorts based on events
- Examples: "Engaged readers" (5+ page views), "High-value content" (10K+ views)
- Use segments in insights and funnels
- Auto-updating (recalculated hourly)

---

## Technical Stack

**Frontend:**
- **Charts**: shadcn/ui charts (Recharts)
- **Drag-and-drop**: @dnd-kit/core
- **Date pickers**: react-day-picker
- **Virtualization**: @tanstack/react-virtual
- **Grid**: CSS Grid (fixed sizes, no library needed)
- **Gestures**: framer-motion

**Backend:**
- **Database**: PostgreSQL with materialized views
- **Event storage**: Dual-write (PostgreSQL + PostHog)
- **Caching**: Redis (insight query cache, 5min TTL)
- **MCP**: Elysia server with SSE transport

**Performance Optimizations:**
- Virtual scrolling for large lists
- Lazy load charts (IntersectionObserver)
- Debounce insight config changes (500ms)
- Optimize chart data (max 100 points on mobile)
- Cache frequently accessed insights

---

## Migration Path

**Phase 1: Foundation** (Week 1-2)
- New sidebar navigation component
- Analytics hub routing structure
- Dashboard grid system
- Insight card components

**Phase 2: Core Features** (Week 3-4)
- Insight creation flow
- Chart library (all types)
- Data management pages
- Funnel and retention visualizations

**Phase 3: Advanced Features** (Week 5-6)
- Annotations system
- Alerts system
- MCP integration
- Saved filters and segments

**Phase 4: Polish** (Week 7-8)
- Mobile responsive design
- Search functionality
- Activity feed
- Dashboard templates
- Export capabilities

**Phase 5: Migration** (Week 9)
- Migrate existing dashboards
- Update all routes
- User communication
- Beta testing

**Phase 6: Launch** (Week 10)
- Feature flags rollout
- Monitor performance
- Gather feedback
- Iterate

---

## Success Metrics

**User Engagement:**
- Dashboard creation rate
- Insight views per user
- Time spent in analytics
- Custom insight creation rate

**Feature Adoption:**
- % users creating custom dashboards
- % users using funnels/retention
- Segments created
- Alerts configured

**Performance:**
- Insight query time < 2 seconds (p95)
- Dashboard load time < 1 second
- Mobile responsiveness score > 95

---

## Future Enhancements

**Post-Launch:**
- Real-time data (last hour, no delay)
- Scheduled reports (email daily/weekly)
- Dashboard sharing (public links with auth)
- Collaborative insights (comments, mentions)
- Advanced SQL query builder
- Custom event pipelines
- Data warehouse integration

---

**End of Design Document**
