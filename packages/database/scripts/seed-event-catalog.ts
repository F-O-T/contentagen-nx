/**
 * Seed script for the event_catalog table.
 *
 * Usage:
 *   bun run seed:events          (from packages/database)
 *   bun run --filter @packages/database seed:events  (from workspace root)
 */

import { createDb } from "../src/client";
import { eventCatalog } from "../src/schemas/event-catalog";
import { eventCatalogSeed } from "../src/seed/event-catalog-seed";

async function main() {
	console.log("--- Event Catalog Seed ---\n");

	const db = createDb();

	// 1. Clear existing entries
	const deleted = await db.delete(eventCatalog).returning({ id: eventCatalog.id });
	console.log(`Deleted ${deleted.length} existing catalog entries.`);

	// 2. Insert seed data
	const inserted = await db
		.insert(eventCatalog)
		.values(eventCatalogSeed)
		.returning();

	// 3. Summary
	const billableCount = inserted.filter((e) => e.isBillable).length;
	const nonBillableCount = inserted.length - billableCount;
	const withFreeTier = inserted.filter((e) => e.freeTierLimit > 0);

	console.log(`\nInserted ${inserted.length} catalog entries.`);
	console.log(`  Billable:     ${billableCount}`);
	console.log(`  Non-billable: ${nonBillableCount}`);
	console.log(`\nFree tier allocations:`);

	for (const entry of withFreeTier) {
		console.log(
			`  ${entry.eventName.padEnd(28)} ${entry.freeTierLimit.toLocaleString()} events`,
		);
	}

	console.log("\n--- Done ---");
	process.exit(0);
}

main().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
