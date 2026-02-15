/**
 * Migrate Events to Make teamId Required
 *
 * Backfills NULL teamId values for all existing events by assigning them
 * to the organization's first team (or creating a "Default" team if none exists).
 * This migration is required before making the teamId column NOT NULL.
 *
 * Usage:
 *   bun run scripts/migrate-events-make-teamid-required.ts run --dry-run
 *   bun run scripts/migrate-events-make-teamid-required.ts run
 *   bun run scripts/migrate-events-make-teamid-required.ts run --env production
 *   bun run scripts/migrate-events-make-teamid-required.ts check
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { createDb } from "@packages/database/client";
import { organization, team } from "@packages/database/schemas/auth";
import { events } from "@packages/database/schemas/events";
import { and, eq, isNull } from "drizzle-orm";
import chalk from "chalk";
import { Command } from "commander";
import { config } from "dotenv";

const program = new Command();

const colors = {
	blue: chalk.blue,
	cyan: chalk.cyan,
	green: chalk.green,
	red: chalk.red,
	yellow: chalk.yellow,
	gray: chalk.gray,
};

const DATABASE_PACKAGE_DIR = path.join(process.cwd(), "packages", "database");

function getEnvFilePath(env: string): string {
	const possibleFiles = [
		`.env.${env}.local`,
		`.env.${env}`,
		".env.local",
		".env",
	];

	for (const file of possibleFiles) {
		const filePath = path.join(DATABASE_PACKAGE_DIR, file);
		if (fs.existsSync(filePath)) {
			return filePath;
		}
	}

	throw new Error(`No environment file found for ${env} in packages/database`);
}

function loadEnv(env: string) {
	const envFile = getEnvFilePath(env);
	console.log(colors.cyan(`   Loading env from: ${envFile}`));
	config({ path: envFile });
}

function requireDatabaseUrl() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		console.error(colors.red("❌ DATABASE_URL is required"));
		process.exit(1);
	}
	return databaseUrl;
}

async function runMigration(env: string, dryRun: boolean) {
	console.log(colors.blue("--- Migrate Events to Make teamId Required ---\n"));
	console.log(colors.cyan(`   Environment: ${env}`));
	console.log(colors.cyan(`   Mode: ${dryRun ? "DRY RUN" : "LIVE"}`));
	console.log(colors.cyan("-".repeat(50)));

	loadEnv(env);
	const databaseUrl = requireDatabaseUrl();
	const db = createDb({ databaseUrl });

	// Get all organizations
	const orgs = await db.select().from(organization);
	console.log(colors.cyan(`\n   Found ${orgs.length} organizations\n`));

	let totalEventsUpdated = 0;
	let teamsCreated = 0;

	for (const org of orgs) {
		// Get or create default team
		const teams = await db
			.select()
			.from(team)
			.where(eq(team.organizationId, org.id));

		let defaultTeam = teams[0];

		if (!defaultTeam) {
			console.log(
				colors.yellow(`   Creating default team for org: ${org.name}`),
			);

			if (!dryRun) {
				const [newTeam] = await db
					.insert(team)
					.values({
						name: "Default",
						organizationId: org.id,
						createdAt: new Date(),
					})
					.returning();
				defaultTeam = newTeam;
			} else {
				console.log(colors.gray("     (DRY RUN) Would create team"));
				// In dry run, skip this org since we don't have a real team ID
				continue;
			}

			teamsCreated++;
		}

		// Count events with NULL teamId
		const eventsToUpdate = await db
			.select()
			.from(events)
			.where(and(eq(events.organizationId, org.id), isNull(events.teamId)));

		if (eventsToUpdate.length > 0) {
			console.log(
				colors.cyan(
					`   ${org.name}: ${eventsToUpdate.length} events → team "${defaultTeam.name}"`,
				),
			);

			if (!dryRun) {
				// Update only events that have null teamId
				await db
					.update(events)
					.set({ teamId: defaultTeam.id })
					.where(and(eq(events.organizationId, org.id), isNull(events.teamId)));
			}

			totalEventsUpdated += eventsToUpdate.length;
		}
	}

	console.log(colors.cyan("\n" + "-".repeat(50)));
	console.log(colors.blue("\n📊 Summary:\n"));
	console.log(colors.green(`   ✓ Teams created: ${teamsCreated}`));
	console.log(colors.green(`   ✓ Events updated: ${totalEventsUpdated}`));

	if (dryRun) {
		console.log(colors.yellow("\n⚠️  DRY RUN - no data was modified\n"));
	} else {
		console.log(colors.green("\n✅ Migration completed successfully!\n"));
		console.log(
			colors.cyan(
				"   Next step: Run database migration to make teamId NOT NULL",
			),
		);
	}
}

program
	.name("migrate-events-make-teamid-required")
	.description(
		"Backfill NULL teamId values for all existing events before making it required",
	)
	.version("1.0.0");

program
	.command("run")
	.description("Run the migration")
	.option(
		"-e, --env <environment>",
		"Environment to use (local, production, etc.)",
		"local",
	)
	.option("--dry-run", "Preview changes without modifying data", false)
	.action(async (options) => {
		await runMigration(options.env, options.dryRun).catch((err) => {
			console.error(colors.red("\n❌ Migration failed:"), err);
			process.exit(1);
		});
	});

program
	.command("check")
	.description("Check required configuration")
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
		console.log(colors.gray(`   ${databaseUrl.replace(/:[^:@]+@/, ":***@")}`));
	});

program.parse();
