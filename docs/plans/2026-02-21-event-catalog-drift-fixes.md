# Event Catalog Drift Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix four bugs that cause events to silently emit at $0, store wrong `isBillable` values in the DB, and leave the catalog drift undetectable by CI.

**Architecture:** All changes are in the events package (`packages/events/src/`) and the seed script (`scripts/seed-event-catalog.ts`). The fix to `isBillable` requires changing `getEventPrice()` to return a tuple `{ price, isBillable }` and updating both callers in `emit.ts`. The `check` command gets a real DB diff so CI can catch staleness. `bun dev` gets an idempotent seed prepended.

**Tech Stack:** Drizzle ORM, `@f-o-t/money`, BullMQ, Bun scripts, Commander CLI

---

## Task 1: Add asset events to EVENT_PRICING

Three asset events (`asset.upload_completed`, `asset.deleted`, `asset.thumbnail_generated`) are defined in `packages/events/src/assets.ts` but have no entry in `scripts/seed-event-catalog.ts`. Every call to these events falls back to $0.

**Files:**
- Modify: `scripts/seed-event-catalog.ts:5-13` (imports) and `:32-76` (EVENT_PRICING array)

**Step 1: Add the ASSET_EVENTS import**

In `scripts/seed-event-catalog.ts`, find the import block at the top and add:
```typescript
import { ASSET_EVENTS } from "@packages/events/assets";
```
Place it after the existing `import { AI_EVENTS }` line.

**Step 2: Add the 3 asset entries to EVENT_PRICING**

After the `// Insights` block (around line 75), add a new `// Assets` section:
```typescript
   // Assets
   { eventName: ASSET_EVENTS["asset.upload_completed"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000500", freeTierLimit: 500, displayName: "Asset Uploaded", description: "Fired when a file asset is uploaded and processing completes.", isBillable: true },
   { eventName: ASSET_EVENTS["asset.deleted"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Asset Deleted", description: "Fired when a file asset is permanently deleted.", isBillable: false },
   { eventName: ASSET_EVENTS["asset.thumbnail_generated"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000100", freeTierLimit: 1_000, displayName: "Thumbnail Generated", description: "Fired when an image thumbnail is generated for an uploaded asset.", isBillable: true },
```

**Step 3: Verify the import resolves**

```bash
cd /home/yorizel/Documents/contentta-nx
bun run scripts/seed-event-catalog.ts run --dry-run
```
Expected: output should now list 3 extra entries (total count goes from 35 → 38). No import errors.

**Step 4: Commit**

```bash
git add scripts/seed-event-catalog.ts
git commit -m "fix(events): add missing asset events to EVENT_PRICING seed"
```

---

## Task 2: Fix isBillable hardcoded to `true` in emitEvent / emitEventBatch

`emit.ts:123` writes `isBillable: true as const` for every stored event, regardless of what the catalog says. 19 non-billable events are stored with `isBillable=true`, corrupting billing views.

**Files:**
- Modify: `packages/events/src/utils.ts`
- Modify: `packages/events/src/emit.ts`

**Step 1: Change `getEventPrice()` to return `{ price, isBillable }`**

Replace the entire `getEventPrice` function in `packages/events/src/utils.ts`:

```typescript
/**
 * Looks up the price and billability for a given event name from the event_catalog table.
 * Returns a Money object with 6-decimal precision matching the DB schema.
 * Returns { price: $0, isBillable: false } if the event is not found in the catalog.
 */
export async function getEventPrice(
   db: DatabaseInstance,
   eventName: string,
): Promise<{ price: Money; isBillable: boolean }> {
   const [catalogEntry] = await db
      .select({
         pricePerEvent: eventCatalog.pricePerEvent,
         isBillable: eventCatalog.isBillable,
      })
      .from(eventCatalog)
      .where(eq(eventCatalog.eventName, eventName))
      .limit(1);

   if (!catalogEntry) {
      console.warn(
         `[Events] Event not found in catalog: ${eventName}, defaulting to $0`,
      );
      return { price: createMoney(0n, CURRENCY, PRICE_SCALE), isBillable: false };
   }

   return {
      price: createMoney(
         parseDecimalToMinorUnits(catalogEntry.pricePerEvent, PRICE_SCALE),
         CURRENCY,
         PRICE_SCALE,
      ),
      isBillable: catalogEntry.isBillable,
   };
}
```

**Step 2: Update `emitEvent()` in `emit.ts`**

Replace these two lines in `emitEvent()`:
```typescript
// OLD
const price = params.priceOverride ?? await getEventPrice(db, eventName);
```
With:
```typescript
// NEW
const { price, isBillable } = params.priceOverride
   ? { price: params.priceOverride, isBillable: true }
   : await getEventPrice(db, eventName);
```

Then replace the hardcoded `isBillable: true` in the `.values({...})` call:
```typescript
// OLD
isBillable: true,
pricePerEvent: toMajorUnitsString(price),

// NEW
isBillable,
pricePerEvent: toMajorUnitsString(price),
```

**Step 3: Update `emitEventBatch()` in `emit.ts`**

Replace the price lookup section:
```typescript
// OLD
const priceMap = new Map<string, string>();

await Promise.all(
   uniqueNames.map(async (name) => {
      const price = await getEventPrice(db, name);
      priceMap.set(name, toMajorUnitsString(price));
   }),
);

// In rows map:
isBillable: true as const,
pricePerEvent: priceMap.get(evt.eventName) ?? "0",
```
With:
```typescript
// NEW
const billingMap = new Map<string, { priceStr: string; isBillable: boolean }>();

await Promise.all(
   uniqueNames.map(async (name) => {
      const { price, isBillable } = await getEventPrice(db, name);
      billingMap.set(name, { priceStr: toMajorUnitsString(price), isBillable });
   }),
);

// In rows map:
const billing = billingMap.get(evt.eventName) ?? { priceStr: "0", isBillable: false };
// then in the row object:
isBillable: billing.isBillable,
pricePerEvent: billing.priceStr,
```

**Step 4: Typecheck**

```bash
bun run typecheck
```
Expected: No errors. The `isBillable: true as const` type was only used in the hardcoded rows — removing it is fine.

**Step 5: Commit**

```bash
git add packages/events/src/utils.ts packages/events/src/emit.ts
git commit -m "fix(events): derive isBillable from catalog instead of hardcoding true"
```

---

## Task 3: Rewrite the `check` command to detect catalog drift

The current `check` command only validates that `DATABASE_URL` is set — it does not compare code-defined events vs. DB rows. This means CI gets a false ✅ even when the catalog is completely stale.

**Files:**
- Modify: `scripts/seed-event-catalog.ts:209-229` (the `check` command `.action()` handler)

**Step 1: Replace the check command action**

Replace the existing `check` command registration:
```typescript
program
   .command("check")
   .description("Check required configuration for seeding")
   .option(
      "-e, --env <environment>",
      "Environment to use (local, production, etc.)",
      "local",
   )
   .action((options) => {
      loadEnv(options.env);
      const databaseUrl = process.env.DATABASE_URL;

      console.log(colors.blue("🔍 Checking configuration...\n"));

      if (!databaseUrl) {
         console.log(colors.red("❌ DATABASE_URL is not set"));
         process.exit(1);
      }

      console.log(colors.green("✅ DATABASE_URL is set"));
   });
```
With:
```typescript
program
   .command("check")
   .description("Diff EVENT_PRICING code definitions against the live event_catalog table. Exits non-zero on drift.")
   .option(
      "-e, --env <environment>",
      "Environment to use (local, production, etc.)",
      "local",
   )
   .action(async (options) => {
      loadEnv(options.env);
      const databaseUrl = requireDatabaseUrl();

      console.log(colors.blue("🔍 Checking event catalog drift...\n"));

      const db = createDb({ databaseUrl });

      const rows = await db
         .select({ eventName: eventCatalog.eventName })
         .from(eventCatalog);

      const dbNames = new Set(rows.map((r) => r.eventName));
      const codeNames = new Set(EVENT_PRICING.map((e) => e.eventName));

      const missingInDb = [...codeNames].filter((n) => !dbNames.has(n));
      const extraInDb = [...dbNames].filter((n) => !codeNames.has(n));

      if (missingInDb.length > 0) {
         console.log(colors.red(`❌ ${missingInDb.length} event(s) defined in code but missing from DB catalog:`));
         for (const name of missingInDb) {
            console.log(colors.red(`   - ${name}`));
         }
      }

      if (extraInDb.length > 0) {
         console.log(colors.yellow(`⚠️  ${extraInDb.length} event(s) in DB catalog but not defined in code (stale rows):`));
         for (const name of extraInDb) {
            console.log(colors.yellow(`   - ${name}`));
         }
      }

      if (missingInDb.length === 0 && extraInDb.length === 0) {
         console.log(colors.green(`✅ Catalog is in sync. ${codeNames.size} events match.`));
         process.exit(0);
      } else {
         console.log(colors.red("\n❌ Catalog drift detected. Run: bun run seed:events"));
         process.exit(1);
      }
   });
```

**Step 2: Test check command manually (dry run only — no live DB needed for this step)**

You can test the parsing/CLI structure works:
```bash
bun run scripts/seed-event-catalog.ts check --help
```
Expected: Shows help text including the new description "Diff EVENT_PRICING code definitions...".

**Step 3: Commit**

```bash
git add scripts/seed-event-catalog.ts
git commit -m "fix(events): rewrite check command to detect catalog drift vs DB"
```

---

## Task 4: Auto-seed event catalog on `bun dev`

The seed is idempotent (delete-all + reinsert), costs ~1 second, and prevents the catalog from ever being stale locally. Prepend it to `bun dev`.

**Files:**
- Modify: `package.json:39`

**Step 1: Update the dev script**

Find this line in `package.json`:
```json
"dev": "nx run-many -t dev --parallel=3 -p web",
```
Replace with:
```json
"dev": "bun run scripts/seed-event-catalog.ts run --env local && nx run-many -t dev --parallel=3 -p web",
```

**Step 2: Verify the script syntax is valid**

```bash
bun run --print "JSON.parse(require('fs').readFileSync('package.json', 'utf-8')).scripts.dev"
```
Expected: prints the new dev script string without JSON parse errors.

**Step 3: Commit**

```bash
git add package.json
git commit -m "fix(events): auto-seed event catalog before bun dev"
```

---

## Final Verification

After all tasks, confirm everything works together:

```bash
# Dry run to see all 38 events (35 original + 3 asset)
bun run scripts/seed-event-catalog.ts run --dry-run

# Typecheck the events package
bun run typecheck
```

Expected:
- Dry run shows 38 entries including asset events
- Typecheck passes with no errors
