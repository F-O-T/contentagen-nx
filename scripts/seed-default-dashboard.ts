/**
 * Seed Default Dashboard with Insights
 *
 * This script adds default insights and tiles to existing empty dashboards.
 * It's useful when dashboards were created before the default tile logic was added.
 *
 * Usage:
 *   bun run scripts/seed-default-dashboard.ts run
 *   bun run scripts/seed-default-dashboard.ts run --env production
 *   bun run scripts/seed-default-dashboard.ts run --dry-run
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { createDb } from "@packages/database/client";
import { dashboards } from "@packages/database/schemas/dashboards";
import { insights } from "@packages/database/schemas/insights";
import { DEFAULT_INSIGHTS } from "@packages/analytics/default-dashboard";
import chalk from "chalk";
import { Command } from "commander";
import { config } from "dotenv";
import { eq } from "drizzle-orm";

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

async function runSeed(env: string, dryRun: boolean) {
   console.log(colors.blue("--- Default Dashboard Seeding ---\n"));
   console.log(colors.cyan(`   Environment: ${env}`));
   console.log(colors.cyan(`   Mode: ${dryRun ? "DRY RUN" : "LIVE"}`));
   console.log(colors.cyan("-".repeat(50)));

   loadEnv(env);
   const databaseUrl = requireDatabaseUrl();
   const db = createDb({ databaseUrl });

   console.log(colors.blue("\n🔍 Finding dashboards without tiles...\n"));

   // Find all default dashboards
   const allDashboards = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.isDefault, true));

   console.log(
      colors.gray(`   Found ${allDashboards.length} default dashboard(s)\n`),
   );

   const emptyDashboards = allDashboards.filter((d) => d.tiles.length === 0);

   if (emptyDashboards.length === 0) {
      console.log(
         colors.green(
            "✅ All default dashboards already have tiles. Nothing to do!",
         ),
      );
      return;
   }

   console.log(
      colors.yellow(
         `   ${emptyDashboards.length} dashboard(s) need default tiles\n`,
      ),
   );

   let totalInsightsCreated = 0;
   let totalDashboardsUpdated = 0;

   for (const dashboard of emptyDashboards) {
      console.log(
         colors.blue(
            `📊 Processing: ${colors.cyan(dashboard.name)} (${dashboard.id})`,
         ),
      );

      // Check if this org already has insights
      const existingInsights = await db
         .select()
         .from(insights)
         .where(eq(insights.organizationId, dashboard.organizationId));

      let insightIds: string[];
      let createdCount = 0;

      if (existingInsights.length >= DEFAULT_INSIGHTS.length) {
         // Use existing insights
         console.log(
            colors.gray(
               `   ℹ️  Using ${existingInsights.length} existing insights`,
            ),
         );
         insightIds = existingInsights
            .slice(0, DEFAULT_INSIGHTS.length)
            .map((i) => i.id);
      } else {
         // Create new insights
         console.log(
            colors.cyan(
               `   ➕ Creating ${DEFAULT_INSIGHTS.length} default insights...`,
            ),
         );

         if (!dryRun) {
            const insightRecords = DEFAULT_INSIGHTS.map((def) => ({
               organizationId: dashboard.organizationId,
               createdBy: dashboard.createdBy,
               name: def.name,
               description: def.description,
               type: def.type,
               config: def.config as Record<string, unknown>,
               defaultSize: def.defaultSize,
            }));

            const created = await db
               .insert(insights)
               .values(insightRecords)
               .returning({ id: insights.id });

            insightIds = created.map((r) => r.id);
            createdCount = insightIds.length;
            totalInsightsCreated += createdCount;

            console.log(colors.green(`   ✓ Created ${createdCount} insights`));
         } else {
            console.log(
               colors.yellow(
                  `   [DRY RUN] Would create ${DEFAULT_INSIGHTS.length} insights`,
               ),
            );
            insightIds = Array(DEFAULT_INSIGHTS.length)
               .fill("")
               .map(() => "mock-id");
         }
      }

      // Build tiles
      const tiles = insightIds.map((insightId, index) => ({
         insightId,
         size: DEFAULT_INSIGHTS[index]?.defaultSize || "md",
         order: index,
      }));

      // Update dashboard with tiles
      if (!dryRun) {
         await db
            .update(dashboards)
            .set({ tiles })
            .where(eq(dashboards.id, dashboard.id));

         totalDashboardsUpdated++;
         console.log(
            colors.green(
               `   ✓ Added ${tiles.length} tiles to "${dashboard.name}"\n`,
            ),
         );
      } else {
         console.log(
            colors.yellow(
               `   [DRY RUN] Would add ${tiles.length} tiles to "${dashboard.name}"\n`,
            ),
         );
      }
   }

   console.log(colors.cyan("-".repeat(50)));
   console.log(colors.blue("\n📊 Summary:\n"));

   if (dryRun) {
      console.log(
         colors.yellow(
            `   Would update ${emptyDashboards.length} dashboard(s)`,
         ),
      );
      console.log(
         colors.yellow(
            `   Would create ~${DEFAULT_INSIGHTS.length * emptyDashboards.length} insight(s)`,
         ),
      );
      console.log(colors.yellow("\n⚠️  DRY RUN - no data was modified\n"));
   } else {
      console.log(
         colors.green(`   ✓ Updated ${totalDashboardsUpdated} dashboard(s)`),
      );
      console.log(
         colors.green(`   ✓ Created ${totalInsightsCreated} insight(s)`),
      );
      console.log(colors.green("\n✅ Seeding complete!\n"));
   }
}

program
   .name("seed-default-dashboard")
   .description("Add default insights and tiles to empty dashboards")
   .version("1.0.0");

program
   .command("run")
   .description("Seed default dashboards with insights and tiles")
   .option(
      "-e, --env <environment>",
      "Environment to use (local, production, etc.)",
      "local",
   )
   .option("--dry-run", "Preview changes without modifying data", false)
   .action(async (options) => {
      await runSeed(options.env, options.dryRun).catch((err) => {
         console.error(colors.red("\n❌ Seed failed:"), err);
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
      console.log(
         colors.green(
            `✅ ${DEFAULT_INSIGHTS.length} default insights configured`,
         ),
      );
   });

program.parse();
