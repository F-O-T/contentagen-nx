import * as fs from "node:fs";
import * as path from "node:path";
import { createDb } from "@packages/database/client";
import { eventCatalog } from "@packages/database/schemas/event-catalog";
import { EVENT_PRICING, toSeedEntry } from "@packages/events/pricing";
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

function printSummary(inserted: Array<typeof eventCatalog.$inferSelect>) {
   const billableCount = inserted.filter((entry) => entry.isBillable).length;
   const nonBillableCount = inserted.length - billableCount;
   const withFreeTier = inserted.filter((entry) => entry.freeTierLimit > 0);

   console.log(`\nInserted ${inserted.length} catalog entries.`);
   console.log(`  Billable:     ${billableCount}`);
   console.log(`  Non-billable: ${nonBillableCount}`);
   console.log("\nFree tier allocations:");

   for (const entry of withFreeTier) {
      console.log(
         `  ${entry.eventName.padEnd(28)} ${entry.freeTierLimit.toLocaleString()} events`,
      );
   }
}

async function runSeed(env: string, dryRun: boolean) {
   console.log(colors.blue("--- Event Catalog Seed ---\n"));
   console.log(colors.cyan(`   Environment: ${env}`));
   console.log(colors.cyan(`   Mode: ${dryRun ? "DRY RUN" : "LIVE"}`));
   console.log(colors.cyan("-".repeat(50)));

   loadEnv(env);
   const databaseUrl = requireDatabaseUrl();

   if (dryRun) {
      const inserted = EVENT_PRICING.map(toSeedEntry);
      printSummary(inserted as Array<typeof eventCatalog.$inferSelect>);
      console.log(
         colors.yellow("\n⚠️  DRY RUN completed - no data was modified"),
      );
      return;
   }

   const db = createDb({ databaseUrl });

   const deleted = await db
      .delete(eventCatalog)
      .returning({ id: eventCatalog.id });
   console.log(`Deleted ${deleted.length} existing catalog entries.`);

   const inserted = await db
      .insert(eventCatalog)
      .values(EVENT_PRICING.map(toSeedEntry))
      .returning();

   printSummary(inserted);
   console.log(colors.green("\n--- Done ---"));
}

program
   .name("seed-event-catalog")
   .description("Seed the event_catalog table")
   .version("1.0.0");

program
   .command("run")
   .description("Seed the event catalog")
   .option(
      "-e, --env <environment>",
      "Environment to use (local, production, etc.)",
      "local",
   )
   .option("--dry-run", "Preview changes without modifying data", false)
   .action(async (options) => {
      await runSeed(options.env, options.dryRun).catch((err) => {
         console.error(colors.red("Seed failed:"), err);
         process.exit(1);
      });
   });

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

program.parse();
