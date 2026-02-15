/**
 * Verify Public API Key Migration
 *
 * Verification and cleanup tool for the public API key migration from
 * organization-level keys to Better Auth per-team keys (lazy creation).
 *
 * Since teams get their public API key auto-created on first access via
 * `team.getPublicApiKey`, this script reports the migration state and
 * optionally cleans up old organization.publicApiKey values.
 *
 * Usage:
 *   bun run scripts/verify-public-api-key-migration.ts check
 *   bun run scripts/verify-public-api-key-migration.ts run --dry-run
 *   bun run scripts/verify-public-api-key-migration.ts run
 *   bun run scripts/verify-public-api-key-migration.ts run --env production
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { createDb } from "@packages/database/client";
import { organization, team } from "@packages/database/schemas/auth";
import chalk from "chalk";
import { Command } from "commander";
import { config } from "dotenv";
import { count, isNotNull } from "drizzle-orm";

// ── Configuration ────────────────────────────────────────────────────────

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

// ── Environment Handling ─────────────────────────────────────────────────

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

	throw new Error(
		`No environment file found for ${env} in packages/database`,
	);
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

// ── Report Logic ─────────────────────────────────────────────────────────

async function generateReport(db: ReturnType<typeof createDb>) {
	const [orgsWithKeysResult] = await db
		.select({ count: count() })
		.from(organization)
		.where(isNotNull(organization.publicApiKey));

	const [totalOrgsResult] = await db
		.select({ count: count() })
		.from(organization);

	const [totalTeamsResult] = await db.select({ count: count() }).from(team);

	const orgsWithKeys = orgsWithKeysResult?.count ?? 0;
	const totalOrgs = totalOrgsResult?.count ?? 0;
	const totalTeams = totalTeamsResult?.count ?? 0;
	const orgsWithoutKeys = totalOrgs - orgsWithKeys;

	return { orgsWithKeys, totalOrgs, totalTeams, orgsWithoutKeys };
}

function printReport(report: Awaited<ReturnType<typeof generateReport>>) {
	console.log(colors.blue("\n📊 Migration Status Report:\n"));

	console.log(
		colors.cyan(`   Organizations total:          ${report.totalOrgs}`),
	);
	console.log(
		report.orgsWithKeys > 0
			? colors.yellow(
					`   Organizations with old key:   ${report.orgsWithKeys} (need cleanup)`,
				)
			: colors.green(
					`   Organizations with old key:   ${report.orgsWithKeys} (clean)`,
				),
	);
	console.log(
		colors.cyan(
			`   Organizations without key:    ${report.orgsWithoutKeys}`,
		),
	);
	console.log(colors.cyan(`   Teams total:                  ${report.totalTeams}`));
	console.log(
		colors.gray(
			`\n   Note: Team public API keys are created lazily on first access.`,
		),
	);
}

// ── Main Logic ───────────────────────────────────────────────────────────

async function runVerification(env: string, dryRun: boolean) {
	console.log(colors.blue("--- Public API Key Migration Verification ---\n"));
	console.log(colors.cyan(`   Environment: ${env}`));
	console.log(colors.cyan(`   Mode: ${dryRun ? "DRY RUN" : "LIVE"}`));
	console.log(colors.cyan("-".repeat(50)));

	loadEnv(env);
	const databaseUrl = requireDatabaseUrl();
	const db = createDb({ databaseUrl });

	const report = await generateReport(db);
	printReport(report);

	if (report.orgsWithKeys === 0) {
		console.log(
			colors.green(
				"\n✅ No old public API keys to clean up. Migration is complete!\n",
			),
		);
		return;
	}

	console.log(colors.cyan("\n" + "-".repeat(50)));

	if (dryRun) {
		console.log(
			colors.yellow(
				`\n   Would set publicApiKey = null for ${report.orgsWithKeys} organization(s)`,
			),
		);
		console.log(colors.yellow("\n⚠️  DRY RUN - no data was modified\n"));
		return;
	}

	// Clean up old organization-level public API keys
	console.log(
		colors.cyan(
			`\n   Cleaning up ${report.orgsWithKeys} old organization public API key(s)...`,
		),
	);

	const result = await db
		.update(organization)
		.set({ publicApiKey: null })
		.where(isNotNull(organization.publicApiKey))
		.returning({ id: organization.id, slug: organization.slug });

	console.log(colors.cyan("\n" + "-".repeat(50)));
	console.log(colors.blue("\n📊 Summary:\n"));
	console.log(
		colors.green(
			`   ✓ Cleared publicApiKey for ${result.length} organization(s):`,
		),
	);

	for (const org of result) {
		console.log(colors.gray(`     - ${org.slug} (${org.id})`));
	}

	console.log(colors.green("\n✅ Cleanup completed successfully!\n"));
}

async function runCheck(env: string) {
	console.log(colors.blue("--- Public API Key Migration Check ---\n"));
	console.log(colors.cyan(`   Environment: ${env}`));
	console.log(colors.cyan("-".repeat(50)));

	loadEnv(env);
	const databaseUrl = requireDatabaseUrl();
	const db = createDb({ databaseUrl });

	const report = await generateReport(db);
	printReport(report);

	if (report.orgsWithKeys === 0) {
		console.log(
			colors.green(
				"\n✅ Migration is complete. No old keys remain.\n",
			),
		);
	} else {
		console.log(
			colors.yellow(
				`\n⚠️  ${report.orgsWithKeys} organization(s) still have old publicApiKey values.`,
			),
		);
		console.log(
			colors.yellow(
				'   Run with "run" command to clean them up.\n',
			),
		);
	}
}

// ── CLI Commands ─────────────────────────────────────────────────────────

program
	.name("verify-public-api-key-migration")
	.description(
		"Verify and clean up the public API key migration from org-level to per-team Better Auth keys",
	)
	.version("1.0.0");

program
	.command("run")
	.description(
		"Clean up old organization-level public API keys (teams use lazy creation)",
	)
	.option(
		"-e, --env <environment>",
		"Environment to use (local, production, etc.)",
		"local",
	)
	.option("--dry-run", "Preview changes without modifying data", false)
	.action(async (options) => {
		await runVerification(options.env, options.dryRun).catch((err) => {
			console.error(colors.red("\n❌ Verification failed:"), err);
			process.exit(1);
		});
	});

program
	.command("check")
	.description("Report migration status without making changes")
	.option(
		"-e, --env <environment>",
		"Environment to use (local, production, etc.)",
		"local",
	)
	.action(async (options) => {
		await runCheck(options.env).catch((err) => {
			console.error(colors.red("\n❌ Check failed:"), err);
			process.exit(1);
		});
	});

program.parse();
