/**
 * Re-index all published content for RAG
 *
 * This script fetches all published content and indexes it using the new Mastra RAG system.
 * Run this after migrating from the old RAG package.
 *
 * Usage: bun run scripts/reindex-content.ts
 */

import { createDb } from "@packages/database/client";
import { content } from "@packages/database/schemas/content";
import {
	initializeRagService,
	isRagAvailable,
	batchIndexContent,
} from "@packages/agents/mastra/rag";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.error("ERROR: DATABASE_URL environment variable is not set");
	process.exit(1);
}

if (!isRagAvailable()) {
	console.error("ERROR: PG_VECTOR_URL environment variable is not set");
	console.error("RAG service is not available. Cannot re-index content.");
	process.exit(1);
}

async function reindexAllContent() {
	console.log("Starting content re-indexing...\n");

	const db = createDb({ databaseUrl: DATABASE_URL! });

	// Initialize RAG service (creates indexes if needed)
	console.log("Initializing RAG service...");
	await initializeRagService();
	console.log("RAG service initialized.\n");

	// Fetch all published content
	console.log("Fetching published content...");
	const publishedContent = await db
		.select()
		.from(content)
		.where(eq(content.status, "published"));

	console.log(`Found ${publishedContent.length} published content items.\n`);

	if (publishedContent.length === 0) {
		console.log("No published content to index. Done!");
		process.exit(0);
	}

	// Prepare content for indexing
	const contentToIndex = publishedContent.map((c) => ({
		id: c.id,
		agentId: c.agentId,
		slug: c.meta?.slug || "",
		title: c.meta?.title || "",
		description: c.meta?.description || "",
		keywords: c.meta?.keywords,
		body: c.body || "",
	}));

	// Batch index with progress
	const BATCH_SIZE = 5;
	let indexed = 0;
	let failed = 0;

	console.log("Indexing content in batches...\n");

	for (let i = 0; i < contentToIndex.length; i += BATCH_SIZE) {
		const batch = contentToIndex.slice(i, i + BATCH_SIZE);
		const results = await batchIndexContent(batch);

		for (const result of results) {
			if (result.metadataIndexed) {
				indexed++;
				console.log(
					`[${indexed}/${publishedContent.length}] Indexed: ${batch.find((c) => c.id === result.contentId)?.title || result.contentId} (${result.chunksIndexed} chunks)`,
				);
			} else {
				failed++;
				console.error(
					`[FAILED] ${batch.find((c) => c.id === result.contentId)?.title || result.contentId}`,
				);
			}
		}
	}

	console.log("\n========================================");
	console.log("Re-indexing complete!");
	console.log(`Successfully indexed: ${indexed}/${publishedContent.length}`);
	if (failed > 0) {
		console.log(`Failed: ${failed}`);
	}
	console.log("========================================\n");

	process.exit(failed > 0 ? 1 : 0);
}

reindexAllContent().catch((err) => {
	console.error("Fatal error during re-indexing:", err);
	process.exit(1);
});
