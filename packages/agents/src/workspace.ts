import path from "node:path";

/**
 * Skills directory path for Mastra Workspace configuration.
 * Skills are SKILL.md files discovered by Mastra's Workspace feature.
 */
export const SKILLS_BASE_PATH = path.resolve(import.meta.dirname, "..");
export const SKILLS_DIR = "/src/skills";
