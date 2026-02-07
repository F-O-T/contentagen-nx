# Plans Page Redesign - Editorial Luxe Comparison Grid

## Goal
Redesign the Plans page to improve conversion and clarity while keeping a premium editorial feel. Emphasis: clear upgrade path, scannable benefits, and a detailed comparison matrix for power users.

## Visual Direction
Editorial Luxe: refined typography pairing (display serif + clean sans), generous whitespace, structured rhythm, and subtle texture. Background uses a warm paper gradient with faint noise and a delicate line motif for depth without visual noise. Color accent remains aligned to existing brand tokens (primary), used sparingly for emphasis.

## Page Structure
1) Hero
- Bold headline in serif display, short supporting line in muted sans.
- Billing toggle as a pill with inset shadow and clear annual savings badge.

2) Plan Cards Row (3 cards)
- Compact, elevated cards with clear hierarchy.
- Pro highlighted as recommended (badge + slightly elevated border).
- Each card includes: plan name, price, short description, primary CTA, and 3 key highlights.
- CTA text adapts to current plan, trial, or upgrade state.

3) Detailed Comparison Grid
- 10-14 rows covering: core features, AI credits, platform credits, team seats, API access, support tier, and trial availability.
- Alternating row tints, strong column alignment, and iconography for fast scanning.

4) Trust Row + FAQ
- Short trust strip (Stripe, cancel anytime, support) to reduce friction.
- 3-4 FAQ items focused on objections (credits, downgrade, billing).

## Components & Data
- Reuse STRIPE_PLANS from @packages/stripe/constants for plan metadata.
- Add a structured comparison matrix array in the Plans page file to drive the table rows.
- Keep current motion primitives (Framer Motion) but reduce intensity for a premium tone.

## UX Notes
- Conversion-first path: hero -> plan cards -> comparison grid.
- Soft sell copy; avoid fake urgency.
- Maintain Portuguese copy to match the dashboard.

## Testing
- Visual review on desktop and mobile.
- Ensure current plan state and disabled CTA still behave correctly.
