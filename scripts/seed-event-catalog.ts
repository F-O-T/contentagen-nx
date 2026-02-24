import * as fs from "node:fs";
import * as path from "node:path";
import { createDb } from "@packages/database/client";
import { eventCatalog } from "@packages/database/schemas/event-catalog";
import { AI_EVENTS } from "@packages/events/ai";
import { ASSET_EVENTS } from "@packages/events/assets";
import { EVENT_CATEGORIES } from "@packages/events/catalog";
import { CLUSTER_EVENTS } from "@packages/events/clusters";
import { CONTENT_EVENTS } from "@packages/events/content";
import { DASHBOARD_EVENTS } from "@packages/events/dashboard";
import { EXPERIMENT_EVENTS } from "@packages/events/experiments";
import { FORM_EVENTS } from "@packages/events/forms";
import { INSIGHT_EVENTS } from "@packages/events/insight";
import { SEO_EVENTS } from "@packages/events/seo";
import { WEBHOOK_EVENTS } from "@packages/events/webhook";
import { WRITER_EVENTS } from "@packages/events/writer";
import chalk from "chalk";
import { Command } from "commander";
import { config } from "dotenv";

// ---------------------------------------------------------------------------
// Event catalog seed data
// ---------------------------------------------------------------------------

interface EventPricing {
   eventName: string;
   category: string;
   pricePerEvent: string; // decimal string, e.g. "0.001000"
   freeTierLimit: number;
   displayName: string;
   description: string;
   isBillable: boolean;
}

const EVENT_PRICING: EventPricing[] = [
   // Content
   { eventName: CONTENT_EVENTS["content.page.view"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000020", freeTierLimit: 10_000, displayName: "Page View", description: "Tracks a single page view on published content.", isBillable: true },
   { eventName: CONTENT_EVENTS["content.page.published"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.001000", freeTierLimit: 100, displayName: "Content Published", description: "Fired when a piece of content transitions to published status.", isBillable: true },
   { eventName: CONTENT_EVENTS["content.page.updated"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000500", freeTierLimit: 500, displayName: "Content Updated", description: "Fired when published content is updated.", isBillable: true },
   { eventName: CONTENT_EVENTS["content.created"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Content Created", description: "Fired when a new content draft is created.", isBillable: false },
   { eventName: CONTENT_EVENTS["content.deleted"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Content Deleted", description: "Fired when content is permanently deleted.", isBillable: false },
   { eventName: CONTENT_EVENTS["content.scroll.milestone"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Scroll Milestone", description: "Tracks when a reader reaches a scroll depth milestone (25%, 50%, 75%, 100%).", isBillable: false },
   { eventName: CONTENT_EVENTS["content.time.spent"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Time Spent", description: "Records cumulative time a reader spends on content.", isBillable: false },
   { eventName: CONTENT_EVENTS["content.cta.click"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "CTA Click", description: "Fired when a reader clicks a call-to-action element.", isBillable: false },
   { eventName: CONTENT_EVENTS["content.exported"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.001000", freeTierLimit: 100, displayName: "Content Exported", description: "Fired when content is exported to an external format.", isBillable: true },
   { eventName: CONTENT_EVENTS["content.archived"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Content Archived", description: "Fired when content is archived.", isBillable: false },
   // Clusters
   { eventName: CLUSTER_EVENTS["cluster.created"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Cluster Created", description: "Fired when a new content cluster (pillar + satellites) is created.", isBillable: false },
   { eventName: CLUSTER_EVENTS["cluster.satellite.added"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Satellite Added", description: "Fired when a satellite post is linked to a cluster pillar.", isBillable: false },
   { eventName: CLUSTER_EVENTS["cluster.satellite.removed"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Satellite Removed", description: "Fired when a satellite post is unlinked from a cluster pillar.", isBillable: false },
   // AI
   { eventName: AI_EVENTS["ai.completion"], category: EVENT_CATEGORIES.ai, pricePerEvent: "0.003000", freeTierLimit: 100, displayName: "AI Completion (FIM)", description: "Tracks a single AI fill-in-the-middle completion.", isBillable: true },
   { eventName: AI_EVENTS["ai.chat_message"], category: EVENT_CATEGORIES.ai, pricePerEvent: "0.020000", freeTierLimit: 50, displayName: "AI Chat Message", description: "Tracks a single AI chat message exchange.", isBillable: true },
   { eventName: AI_EVENTS["ai.agent_action"], category: EVENT_CATEGORIES.ai, pricePerEvent: "0.040000", freeTierLimit: 20, displayName: "AI Agent Action", description: "Tracks a discrete action performed by an AI agent (planning, research, editing).", isBillable: true },
   { eventName: AI_EVENTS["ai.image_generation"], category: EVENT_CATEGORIES.ai, pricePerEvent: "0.900000", freeTierLimit: 5, displayName: "AI Image Generation", description: "Tracks a single AI image generation request via OpenRouter.", isBillable: true },
   // Forms
   { eventName: FORM_EVENTS["form.impression"], category: EVENT_CATEGORIES.form, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Form Impression", description: "Fired when a form is rendered and visible to a user.", isBillable: false },
   { eventName: FORM_EVENTS["form.submitted"], category: EVENT_CATEGORIES.form, pricePerEvent: "0.002000", freeTierLimit: 500, displayName: "Form Submitted", description: "Fired when a form is successfully submitted.", isBillable: true },
   { eventName: FORM_EVENTS["form.field_error"], category: EVENT_CATEGORIES.form, pricePerEvent: "0.000100", freeTierLimit: 1_000, displayName: "Form Field Error", description: "Tracks a field-level validation error on a form.", isBillable: true },
   { eventName: FORM_EVENTS["form.conversion"], category: EVENT_CATEGORIES.form, pricePerEvent: "0.000100", freeTierLimit: 500, displayName: "Form Conversion", description: "Fired when a form submission is attributed as a conversion.", isBillable: true },
   { eventName: FORM_EVENTS["form.created"], category: EVENT_CATEGORIES.form, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Form Created", description: "Fired when a new form is created.", isBillable: false },
   { eventName: FORM_EVENTS["form.updated"], category: EVENT_CATEGORIES.form, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Form Updated", description: "Fired when a form is updated.", isBillable: false },
   { eventName: FORM_EVENTS["form.deleted"], category: EVENT_CATEGORIES.form, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Form Deleted", description: "Fired when a form is deleted.", isBillable: false },
   // SEO
   { eventName: SEO_EVENTS["seo.analyzed"], category: EVENT_CATEGORIES.seo, pricePerEvent: "0.001000", freeTierLimit: 500, displayName: "SEO Analysis", description: "Fired when an SEO analysis pass is run against content.", isBillable: true },
   { eventName: SEO_EVENTS["seo.indexed"], category: EVENT_CATEGORIES.seo, pricePerEvent: "0.000100", freeTierLimit: 1_000, displayName: "SEO Indexed", description: "Fired when content is confirmed indexed by a search engine.", isBillable: true },
   // Experiments
   { eventName: EXPERIMENT_EVENTS["experiment.started"], category: EVENT_CATEGORIES.experiment, pricePerEvent: "0.001000", freeTierLimit: 1_000, displayName: "Experiment Started", description: "Fired when an A/B experiment is activated.", isBillable: true },
   { eventName: EXPERIMENT_EVENTS["experiment.conversion"], category: EVENT_CATEGORIES.experiment, pricePerEvent: "0.000100", freeTierLimit: 1_000, displayName: "Experiment Conversion", description: "Fired when a conversion is recorded for an active experiment.", isBillable: true },
   // Webhooks
   { eventName: WEBHOOK_EVENTS["webhook.endpoint.created"], category: EVENT_CATEGORIES.webhook, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Webhook Endpoint Created", description: "Fired when a webhook endpoint is created.", isBillable: false },
   { eventName: WEBHOOK_EVENTS["webhook.endpoint.updated"], category: EVENT_CATEGORIES.webhook, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Webhook Endpoint Updated", description: "Fired when a webhook endpoint configuration is updated.", isBillable: false },
   { eventName: WEBHOOK_EVENTS["webhook.endpoint.deleted"], category: EVENT_CATEGORIES.webhook, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Webhook Endpoint Deleted", description: "Fired when a webhook endpoint is deleted.", isBillable: false },
   { eventName: WEBHOOK_EVENTS["webhook.delivered"], category: EVENT_CATEGORIES.webhook, pricePerEvent: "0.000500", freeTierLimit: 500, displayName: "Webhook Delivered", description: "Fired when a webhook payload is delivered to an endpoint.", isBillable: true },
   // Dashboards
   { eventName: DASHBOARD_EVENTS["dashboard.created"], category: EVENT_CATEGORIES.dashboard, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Dashboard Created", description: "Fired when a new dashboard is created.", isBillable: false },
   { eventName: DASHBOARD_EVENTS["dashboard.updated"], category: EVENT_CATEGORIES.dashboard, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Dashboard Updated", description: "Fired when a dashboard configuration is updated.", isBillable: false },
   { eventName: DASHBOARD_EVENTS["dashboard.deleted"], category: EVENT_CATEGORIES.dashboard, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Dashboard Deleted", description: "Fired when a dashboard is deleted.", isBillable: false },
   // Insights
   { eventName: INSIGHT_EVENTS["insight.created"], category: EVENT_CATEGORIES.insight, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Insight Created", description: "Fired when a new insight is created.", isBillable: false },
   { eventName: INSIGHT_EVENTS["insight.updated"], category: EVENT_CATEGORIES.insight, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Insight Updated", description: "Fired when an insight is updated.", isBillable: false },
   { eventName: INSIGHT_EVENTS["insight.deleted"], category: EVENT_CATEGORIES.insight, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Insight Deleted", description: "Fired when an insight is deleted.", isBillable: false },
   // Assets
   { eventName: ASSET_EVENTS["asset.upload_completed"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000500", freeTierLimit: 500, displayName: "Asset Uploaded", description: "Fired when a file asset is uploaded and processing completes.", isBillable: true },
   { eventName: ASSET_EVENTS["asset.deleted"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Asset Deleted", description: "Fired when a file asset is permanently deleted.", isBillable: false },
   { eventName: ASSET_EVENTS["asset.thumbnail_generated"], category: EVENT_CATEGORIES.content, pricePerEvent: "0.000100", freeTierLimit: 1_000, displayName: "Thumbnail Generated", description: "Fired when an image thumbnail is generated for an uploaded asset.", isBillable: true },
   // Writers
   { eventName: WRITER_EVENTS["writer.created"], category: EVENT_CATEGORIES.writer, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Writer Created", description: "Fired when a new writer persona is created.", isBillable: false },
   { eventName: WRITER_EVENTS["writer.updated"], category: EVENT_CATEGORIES.writer, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Writer Updated", description: "Fired when a writer persona configuration is updated.", isBillable: false },
   { eventName: WRITER_EVENTS["writer.deleted"], category: EVENT_CATEGORIES.writer, pricePerEvent: "0.000000", freeTierLimit: 0, displayName: "Writer Deleted", description: "Fired when a writer persona is permanently deleted.", isBillable: false },
];

function toSeedEntry(pricing: EventPricing) {
   return {
      eventName: pricing.eventName,
      category: pricing.category,
      pricePerEvent: pricing.pricePerEvent,
      freeTierLimit: pricing.freeTierLimit,
      displayName: pricing.displayName,
      description: pricing.description,
      isBillable: pricing.isBillable,
   };
}

// ---------------------------------------------------------------------------

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

      try {
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
            console.log(colors.red("\n❌ Catalog drift detected. Run: bun run seed:events run"));
            process.exit(1);
         }
      } catch (err) {
         console.error(colors.red("❌ Failed to connect to database or query event_catalog:"), err);
         process.exit(1);
      }
   });

program.parse();
