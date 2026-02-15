# PostHog-Style Dashboard Changes

## 🎨 Visual Design Updates

### Card Styling
- **Left Border Accent**: 4px primary color border on the left edge (`border-l-4 border-l-primary/80`)
- **Rounded Corners**: Changed from `rounded-xl` to `rounded-lg` for a more compact look
- **Card Background**: Clean, simple background without additional overlays

### Header Hierarchy
```
┌─────────────────────────────────────────────┐
│ ◄─ 4px Primary Border                       │
│                                              │
│   TRENDS • LAST 30 DAYS          [...] [x]  │ ← Small caps metadata
│   Analytics de Conteúdo                     │ ← Title (text-base font-semibold)
│   Métricas de performance deste mês         │ ← Description (text-xs)
│                                              │
│   [Chart with subtle horizontal lines]      │
└─────────────────────────────────────────────┘
```

**Header Structure:**
1. **Metadata Label** - `text-[10px] font-semibold tracking-wider uppercase`
   - Examples: "TRENDS • LAST 30 DAYS", "API USAGE • LAST 30 DAYS"
2. **Title** - `text-base font-semibold leading-tight`
3. **Description** - `text-xs leading-relaxed text-muted-foreground`

### Chart Styling
- **Grid Lines**: Subtle horizontal lines only (`stroke-muted/20`, `strokeDasharray="0"`)
- **No Vertical Lines**: `vertical={false}` on all CartesianGrid components
- **Proper Sizing**: Added `aspect-auto` to override default `aspect-video`
- **Clean Axes**: No axis lines, subtle tick marks

## 📁 Files Modified

### Core Components
1. **`packages/ui/src/components/card.tsx`**
   - Changed border radius: `rounded-xl` → `rounded-lg`

2. **`apps/web/src/features/analytics/ui/dashboard-tile.tsx`**
   - Added left border accent
   - Restructured header with metadata label
   - Dynamic metadata based on insight type
   - Support for description text

### Chart Components
3. **`apps/web/src/features/analytics/charts/trends-line-chart.tsx`**
   - Added `aspect-auto` class
   - Updated grid styling: `stroke-muted/20`, solid lines
   - Proper height formatting

4. **`apps/web/src/features/analytics/charts/trends-bar-chart.tsx`**
   - Added `aspect-auto` class
   - Updated grid styling: `stroke-muted/20`, solid lines
   - Proper height formatting

### Home Dashboard Cards
5. **`apps/web/src/routes/.../home/_components/home-content-analytics-card.tsx`**
   - Added PostHog-style header
   - Left border accent
   - Updated grid styling

6. **`apps/web/src/routes/.../home/_components/home-sdk-usage-card.tsx`**
   - Added PostHog-style header with "API USAGE • LAST 30 DAYS"
   - Left border accent
   - Updated grid styling
   - Fixed ChartContainer with `aspect-auto`

7. **`apps/web/src/routes/.../home/_components/home-content-stats-card.tsx`**
   - Added PostHog-style header with "CONTENT OVERVIEW • ALL TIME"
   - Left border accent
   - Fixed ChartContainer sizing

8. **`apps/web/src/features/analytics/ui/insight-preview.tsx`**
   - Removed nested Card wrapper
   - Simplified to direct content rendering

## 🔧 Technical Fixes

### Hydration Issues
- **Removed all `dark:` variant classes** that were causing server/client mismatches
- Simplified grid classes from `dark:stroke-muted/20` to static `stroke-muted/20`

### Chart Rendering
- **Fixed chart sizing** by adding `aspect-auto` to all ChartContainer instances
- This overrides the default `aspect-video` class that was causing width/height errors
- Proper height formatting: `style={{ height: '300px' }}` instead of `{ height: 300 }`

### ShadCN Chart Component Usage
All charts now properly use the shadcn `ChartContainer`:
```tsx
<ChartContainer
  className="w-full aspect-auto"
  config={chartConfig}
  style={{ height: '300px' }}
>
  <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
    <CartesianGrid
      className="stroke-muted/20"
      strokeDasharray="0"
      vertical={false}
    />
    {/* ... rest of chart */}
  </LineChart>
</ChartContainer>
```

## 🎯 Metadata Labels by Insight Type

The dashboard tiles now show dynamic metadata based on insight type:
- **Trends**: "TRENDS • LAST 30 DAYS"
- **Funnels**: "FUNNELS • LAST 30 DAYS"
- **Retention**: "RETENTION • LAST 30 DAYS"
- **Default**: "INSIGHT"

## ✅ What Still Works

- All existing functionality preserved
- Chart interactivity (tooltips, legends)
- Data visualization accuracy
- Responsive layout
- Dark/light mode support (through CSS variables, not conditional classes)

## 🚀 Result

Your insights cards now match the PostHog aesthetic:
- Clean, professional appearance
- Clear visual hierarchy
- Subtle, non-distracting grid lines
- Prominent left border accent using your primary brand color
- Consistent spacing and typography
- Proper chart rendering with shadcn components
