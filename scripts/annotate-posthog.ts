import chalk from "chalk";
import { Command } from "commander";
import "dotenv/config";

const program = new Command();

const colors = {
   blue: chalk.blue,
   cyan: chalk.cyan,
   green: chalk.green,
   magenta: chalk.magenta,
   red: chalk.red,
   yellow: chalk.yellow,
   bold: chalk.bold,
};

interface Annotation {
   content: string;
   date_marker?: string;
   scope?: "dashboard_item" | "project";
   dashboard_item_id?: number;
}

async function createAnnotation(annotation: Annotation): Promise<void> {
   const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
   const PROJECT_ID = process.env.POSTHOG_PROJECT_ID;

   if (!POSTHOG_API_KEY || !PROJECT_ID) {
      throw new Error(
         "Missing POSTHOG_PERSONAL_API_KEY or POSTHOG_PROJECT_ID environment variables",
      );
   }

   const response = await fetch(
      `https://app.posthog.com/api/projects/${PROJECT_ID}/annotations/`,
      {
         method: "POST",
         headers: {
            Authorization: `Bearer ${POSTHOG_API_KEY}`,
            "Content-Type": "application/json",
         },
         body: JSON.stringify({
            content: annotation.content,
            date_marker: annotation.date_marker ?? new Date().toISOString(),
            scope: annotation.scope ?? "project",
            ...(annotation.dashboard_item_id && {
               dashboard_item_id: annotation.dashboard_item_id,
            }),
         }),
      },
   );

   if (!response.ok) {
      const error = await response.text();
      throw new Error(
         `Failed to create annotation: ${response.status} ${error}`,
      );
   }

   const result = await response.json();
   console.log(colors.green(`✅ Annotation created: ${result.uuid}`));
   console.log(colors.cyan(`   Content: ${annotation.content}`));
   console.log(
      colors.cyan(
         `   Date: ${annotation.date_marker ?? new Date().toISOString()}`,
      ),
   );
}

async function run(options: {
   content: string;
   date?: string;
   scope?: "dashboard_item" | "project";
   dashboardItemId?: number;
}) {
   console.log(colors.blue.bold("📝 Creating PostHog Annotation"));
   console.log(colors.cyan("─".repeat(50)));

   try {
      await createAnnotation({
         content: options.content,
         date_marker: options.date,
         scope: options.scope,
         dashboard_item_id: options.dashboardItemId,
      });

      console.log(colors.green("🎉 Done!"));
   } catch (error) {
      console.error(colors.red(`❌ ${error}`));
      process.exit(1);
   }
}

async function check() {
   const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
   const PROJECT_ID = process.env.POSTHOG_PROJECT_ID;

   console.log(colors.blue.bold("🔍 Checking PostHog Annotation CLI"));
   console.log(colors.cyan("─".repeat(50)));

   if (!POSTHOG_API_KEY) {
      console.log(colors.yellow("⚠️  POSTHOG_PERSONAL_API_KEY not set"));
   } else {
      console.log(colors.green("✅ POSTHOG_PERSONAL_API_KEY configured"));
   }

   if (!PROJECT_ID) {
      console.log(colors.yellow("⚠️  POSTHOG_PROJECT_ID not set"));
   } else {
      console.log(colors.green(`✅ POSTHOG_PROJECT_ID: ${PROJECT_ID}`));
   }

   console.log(colors.cyan("─".repeat(50)));
   console.log(colors.blue("💡 Usage:"));
   console.log(
      colors.cyan(
         '   bun run scripts/annotate-posthog.ts run --content "v2.5.0 deployed"',
      ),
   );
   console.log(
      colors.cyan(
         '   bun run scripts/annotate-posthog.ts run --content "Hotfix" --date 2026-02-23T10:00:00Z',
      ),
   );
}

// Railway lambda handler export
export async function handler(event: {
   content: string;
   date?: string;
   scope?: "dashboard_item" | "project";
   dashboardItemId?: number;
}) {
   await run({
      content: event.content,
      date: event.date,
      scope: event.scope,
      dashboardItemId: event.dashboardItemId,
   });
}

// CLI
program
   .name("annotate-posthog")
   .description("Create annotations in PostHog to mark releases and events")
   .version("1.0.0");

program
   .command("run")
   .description("Create a new annotation")
   .requiredOption("-c, --content <text>", "Annotation content")
   .option("-d, --date <iso-date>", "Date for the annotation (ISO format)")
   .option("-s, --scope <scope>", "Scope: project or dashboard_item", "project")
   .option("-i, --dashboard-item-id <id>", "Dashboard item ID", (val) =>
      parseInt(val, 10),
   )
   .action((options) => {
      run({
         content: options.content,
         date: options.date,
         scope: options.scope,
         dashboardItemId: options.dashboardItemId,
      });
   });

program
   .command("check")
   .description("Check environment configuration")
   .action(check);

program.parse();
