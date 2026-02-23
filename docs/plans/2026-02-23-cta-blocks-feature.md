# Feature Request: CTA Blocks

## Problem

Users publishing blog posts need to add calls-to-action (e.g., redirect to pricing, dashboard, demo booking). The current forms builder is evolving toward Typeform/Typebot-style conversational flows — which don't belong at the end of a blog post. Users need a lightweight, purpose-built CTA system for simple redirect-based actions.

## Solution

A new **CTA Blocks** feature — separate from forms — that lets users create, manage, and embed reusable CTA blocks in their content. CTAs are redirect-only (no form fields, no data collection).

---

## CTA Block Types

### 1. Simple

Centered text block with buttons, no container/border.

```
         Title goes here
    Subtitle description text

    [ Primary Button ]  [ Secondary Button ]
```

**Fields:** title, subtitle, primaryButton (text + url), secondaryButton (text + url, optional)

### 2. Card

Same anatomy as Simple but wrapped in a bordered, rounded card container.

```
┌─────────────────────────────────────┐
│                                     │
│          Title goes here            │
│     Subtitle description text       │
│                                     │
│  [ Primary Button ]  [ Secondary ]  │
│                                     │
└─────────────────────────────────────┘
```

**Fields:** title, subtitle, primaryButton (text + url), secondaryButton (text + url, optional)

### 3. Card with Badge

Card variant with a small label/badge above the title (e.g., "Limited Time Offer", "New", "Beta").

```
┌─────────────────────────────────────┐
│  Limited Time Offer                 │
│                                     │
│  Title goes here                    │
│  Subtitle description text          │
│                                     │
│  [ Primary Button → ]               │
│                                     │
└─────────────────────────────────────┘
```

**Fields:** badge (text), title, subtitle, primaryButton (text + url), secondaryButton (text + url, optional)

### 4. Image Banner

A custom image that acts as a clickable link. For users who want full visual control — they design the CTA externally and upload the image.

```
┌─────────────────────────────────────┐
│                                     │
│         [uploaded image]            │
│                                     │
└─────────────────────────────────────┘
         → clicks redirect to URL
```

**Fields:** image (file upload), redirectUrl, altText

---

## Data Model

### `ctas` table

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | Cascade delete |
| team_id | UUID FK | Cascade delete |
| name | text NOT NULL | Internal label for management |
| type | text NOT NULL | `simple`, `card`, `card-with-badge`, `image-banner` |
| config | jsonb NOT NULL | Type-specific fields (see block types above) |
| is_active | boolean | DEFAULT true |
| created_at | timestamp | |
| updated_at | timestamp | Auto-updated |

**Config JSONB shape per type:**

```typescript
// simple | card
{ title: string; subtitle: string; primaryButton: { text: string; url: string }; secondaryButton?: { text: string; url: string } }

// card-with-badge
{ badge: string; title: string; subtitle: string; primaryButton: { text: string; url: string }; secondaryButton?: { text: string; url: string } }

// image-banner
{ imageUrl: string; redirectUrl: string; altText: string }
```

---

## CTA Builder

Full-page builder (same pattern as forms/experiments) with:

- **Header:** Inline-editable CTA name, save button, overflow menu (duplicate, activate/deactivate, delete)
- **Left sidebar:** Configuration fields that change based on the selected type
- **Main canvas:** Live preview of the CTA block as it will render when embedded
- **Templates tab:** Pre-built templates for each block type (shown on create, like form templates)

### Templates (pre-built)

Each block type ships with ready-to-use templates:

**Simple:**
- "Get Started" — generic product signup
- "Book a Demo" — sales-oriented dual button

**Card:**
- "Free Trial" — trial signup with subtitle
- "Learn More" — educational content redirect

**Card with Badge:**
- "Limited Time Offer" — urgency-driven promotion
- "New Feature" — feature announcement
- "Beta Access" — early access invitation

**Image Banner:**
- Blank (upload your own image)

---

## Placement & Inheritance

CTAs can be assigned at multiple levels with a clear override hierarchy:

```
Team settings (global default)
  └── Cluster default (overrides team)
       └── Manual /cta block in editor (overrides everything)
```

### Default behavior
- If a CTA is assigned (via team settings or cluster), it auto-appends at the end of the published post
- This is configurable in **product/team settings**: "Default CTA position" → `end-of-post` (default) | `disabled`

### Manual placement
- `/cta` slash command in the Plate.js editor opens a CTA picker (select from existing CTAs)
- Inserts a CTA block node at the cursor position
- Multiple `/cta` blocks per post are supported
- If a manual `/cta` block exists in the content, the auto-appended default is suppressed (no duplicates)

### Assignment points
- **Team settings:** Default CTA for all posts in the team
- **Cluster:** Default CTA for all posts in a specific cluster (overrides team default)
- **Content (editor):** Manual `/cta` block placement (overrides everything)

---

## Experiment Integration

CTAs are experiment-compatible via the existing experiments system:

- Add `"cta"` to the `targetType` enum: `"content" | "form" | "cluster" | "cta"`
- Add `ctaId` column to `experiment_variants` table (nullable, like `contentId` and `formId`)
- Variant resolution: when a post has an experiment with CTA variants, the SDK resolves which CTA to show based on the visitor's variant assignment

### Events

| Event | Purpose |
|-------|---------|
| `cta.impression` | CTA was rendered/visible to a visitor |
| `cta.click` | Visitor clicked the CTA button/image |

These events carry `ctaId`, `contentId` (which post it appeared on), and optional `experimentId` + `variantId` for experiment attribution.

---

## API Layer

### Dashboard API (oRPC router: `ctas.ts`)

| Procedure | Description |
|-----------|-------------|
| `create` | Create a CTA, emit `cta.created` event |
| `list` | List all CTAs for the active team |
| `getById` | Fetch single CTA (verify org+team ownership) |
| `update` | Update CTA, emit `cta.updated` event |
| `remove` | Delete CTA, emit `cta.deleted` event |

### SDK Server API

| Procedure | Description |
|-----------|-------------|
| `get` | Fetch CTA definition for rendering (active only) |
| `trackImpression` | Record `cta.impression` event |
| `trackClick` | Record `cta.click` event |

---

## Editor Integration (Plate.js)

- New `cta` block node type in the editor schema
- `/cta` slash command in the block menu → opens a CTA picker (list of team's CTAs)
- CTA block renders as a non-editable preview card in the editor (shows the CTA as it will appear)
- Block can be selected, moved, deleted like any other editor block
- Block stores `ctaId` reference — always renders the latest version of the CTA

---

## SDK Rendering

The TypeScript SDK renders CTAs on the published page:

- Fetch CTA definition by ID
- Render as HTML based on block type (simple, card, card-with-badge, image-banner)
- Inject minimal CSS (BEM classes with CSS custom properties, same pattern as form embeds)
- Track `cta.impression` on render
- Track `cta.click` on button/image click
- Handle redirect after click tracking

---

## Sidebar & Navigation

- New sidebar item: **"CTAs"** under the content section
- Flag key: `ctas` (early access, alpha stage)
- List view using `DataTable` pattern (same as forms, experiments)

---

## Out of Scope (v1)

- Scheduling/time-based CTA rules (show CTA X only during a campaign period)
- A/B testing within a single CTA (e.g., testing button text variations) — use experiments for this
- Analytics dashboard for CTAs (use the general analytics/insights system)
- CTA styling customization (colors, fonts) — uses the site's theme via CSS custom properties
- Non-redirect actions (open modal, trigger JS callback, etc.)
