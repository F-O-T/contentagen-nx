import * as fs from "node:fs";
import * as path from "node:path";
import { spawn } from "node:child_process";
import { Command } from "commander";
import chalk from "chalk";

const program = new Command();

// Colors
const colors = {
   blue: chalk.blue,
   green: chalk.green,
   yellow: chalk.yellow,
   red: chalk.red,
   cyan: chalk.cyan,
   magenta: chalk.magenta,
};

// Database packages
const DATABASE_PACKAGES = ["database", "rag"];

function getEnvFilePath(packageDir: string, env: string): string {
   const possibleFiles = [
      `.env.${env}.local`,
      `.env.${env}`,
      `.env.local`,
      `.env`,
   ];

   for (const file of possibleFiles) {
      const filePath = path.join(packageDir, file);
      if (fs.existsSync(filePath)) {
         return filePath;
      }
   }

   throw new Error(`No environment file found for ${env} in ${packageDir}`);
}

function runCommand(
   command: string,
   cwd: string,
   envFile: string,
): Promise<void> {
   return new Promise((resolve, reject) => {
      console.log(colors.blue(`🚀 Running: ${command} in ${cwd}`));
      console.log(colors.cyan(`📁 Using env file: ${envFile}`));

      const fullCommand = `dotenv -e ${envFile} ${command}`;

      const child = spawn(fullCommand, [], {
         cwd,
         shell: true,
         stdio: "inherit",
      });

      child.on("close", (code) => {
         if (code === 0) {
            resolve();
         } else {
            reject(new Error(`Command failed with exit code ${code}`));
         }
      });

      child.on("error", (error) => {
         reject(error);
      });
   });
}

async function runOnPackages(
   action: string,
   env: string,
   packages: string[] = DATABASE_PACKAGES,
) {
   console.log(
      colors.blue(`🔧 Running ${action} on packages with ${env} environment`),
   );
   console.log(colors.cyan("─".repeat(50)));

   const results: { package: string; success: boolean; error?: string }[] = [];

   for (const packageName of packages) {
      const packageDir = path.join("packages", packageName);

      if (!fs.existsSync(packageDir)) {
         console.log(
            colors.red(`❌ Package directory not found: ${packageDir}`),
         );
         results.push({
            package: packageName,
            success: false,
            error: "Directory not found",
         });
         continue;
      }

      try {
         const envFile = getEnvFilePath(packageDir, env);
         console.log(colors.magenta(`📦 Processing package: ${packageName}`));

         await runCommand(`drizzle-kit ${action}`, packageDir, envFile);
         console.log(
            colors.green(`✅ ${packageName} ${action} completed successfully`),
         );
         results.push({ package: packageName, success: true });
      } catch (error) {
         console.log(
            colors.red(`❌ ${packageName} ${action} failed: ${error}`),
         );
         results.push({
            package: packageName,
            success: false,
            error: error instanceof Error ? error.message : String(error),
         });
      }

      console.log(colors.cyan("─".repeat(50)));
   }

   // Summary
   console.log(colors.blue("📊 Summary:"));
   const successCount = results.filter((r) => r.success).length;
   const failureCount = results.filter((r) => !r.success).length;

   console.log(colors.green(`✅ Success: ${successCount}`));
   console.log(colors.red(`❌ Failed: ${failureCount}`));

   if (failureCount > 0) {
      console.log(colors.yellow("⚠️  Failed packages:"));
      results
         .filter((r) => !r.success)
         .forEach((r) => {
            console.log(colors.red(`   - ${r.package}: ${r.error}`));
         });
      process.exit(1);
   }
}

function listEnvironments() {
   console.log(colors.blue("🔍 Available environments:"));

   DATABASE_PACKAGES.forEach((packageName) => {
      const packageDir = path.join("packages", packageName);
      if (fs.existsSync(packageDir)) {
         console.log(colors.magenta(`\n📦 ${packageName}:`));

         const envFiles = fs
            .readdirSync(packageDir)
            .filter(
               (file) => file.startsWith(".env") && !file.includes("example"),
            )
            .sort();

         if (envFiles.length === 0) {
            console.log(colors.yellow("   No environment files found"));
         } else {
            envFiles.forEach((file) => {
               console.log(colors.green(`   ✅ ${file}`));
            });
         }
      }
   });
}

// Commands
program
   .name("db-push")
   .description(
      "CLI tool for pushing database schema changes across monorepo packages",
   )
   .version("1.0.0");

program
   .command("push")
   .description("Push schema changes to database")
   .option(
      "-e, --env <environment>",
      "Environment to use (local, production, etc.)",
      "local",
   )
   .option(
      "-p, --packages <packages>",
      "Comma-separated list of packages to run on",
   )
   .action((options) => {
      const packages = options.packages
         ? options.packages.split(",").map((p: string) => p.trim())
         : DATABASE_PACKAGES;

      runOnPackages("push", options.env, packages);
   });

program
   .command("migrate")
   .description("Generate and run migrations")
   .option(
      "-e, --env <environment>",
      "Environment to use (local, production, etc.)",
      "local",
   )
   .option(
      "-p, --packages <packages>",
      "Comma-separated list of packages to run on",
   )
   .action((options) => {
      const packages = options.packages
         ? options.packages.split(",").map((p: string) => p.trim())
         : DATABASE_PACKAGES;

      runOnPackages("migrate", options.env, packages);
   });

program
   .command("generate")
   .description("Generate migration files")
   .option(
      "-e, --env <environment>",
      "Environment to use (local, production, etc.)",
      "local",
   )
   .option(
      "-p, --packages <packages>",
      "Comma-separated list of packages to run on",
   )
   .action((options) => {
      const packages = options.packages
         ? options.packages.split(",").map((p: string) => p.trim())
         : DATABASE_PACKAGES;

      runOnPackages("generate --custom", options.env, packages);
   });

program
   .command("studio")
   .description("Open Drizzle Studio")
   .option(
      "-e, --env <environment>",
      "Environment to use (local, production, etc.)",
      "local",
   )
   .option(
      "-p, --packages <packages>",
      "Comma-separated list of packages to run on",
   )
   .action((options) => {
      const packages = options.packages
         ? options.packages.split(",").map((p: string) => p.trim())
         : DATABASE_PACKAGES;

      console.log(
         colors.yellow("🚨 Note: Studio will open in separate windows/tabs"),
      );
      runOnPackages("studio", options.env, packages);
   });

program
   .command("envs")
   .description("List available environment files for all database packages")
   .action(() => {
      listEnvironments();
   });

program
   .command("status")
   .description("Check database connection and schema status")
   .option(
      "-e, --env <environment>",
      "Environment to use (local, production, etc.)",
      "local",
   )
   .action((options) => {
      console.log(colors.blue("🔍 Checking database status..."));
      // This would need to be implemented based on your specific setup
      console.log(colors.yellow("⚠️  Status check not implemented yet"));
   });

program.parse();
