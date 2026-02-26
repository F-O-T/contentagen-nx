// packages/agents/src/mastra/workspace/index.ts
import path from "node:path";
import { Workspace, LocalFilesystem } from "@mastra/core/workspace";
import { embed } from "ai";
import { embeddingModel, pgVectorStore } from "../../utils";

/**
 * Absolute path to the skills directory.
 * Resolves to: packages/agents/src/skills/
 */
const SKILLS_DIR = path.resolve(import.meta.dirname, "../../skills");

/**
 * Wrapper that adapts Mastra's embeddingModel (ModelRouterEmbeddingModel)
 * to the plain async (text: string) => Promise<number[]> interface
 * expected by Workspace.
 */
const embedder = async (text: string): Promise<number[]> => {
   const { embedding } = await embed({
      model: embeddingModel,
      value: text,
   });
   return embedding;
};

/**
 * Mastra Workspace backed by the local skills directory.
 *
 * - filesystem: LocalFilesystem pointing to src/skills/
 * - skills: ["/"] — indexes all subdirectories as skills from the root
 * - bm25: BM25 text index for keyword search
 * - vectorStore + embedder: semantic search via pgvector
 * - searchIndexName: SQL-safe index name for PgVector
 */
export const workspace = new Workspace({
   filesystem: new LocalFilesystem({
      basePath: SKILLS_DIR,
   }),
   skills: ["/"],
   bm25: true,
   vectorStore: pgVectorStore,
   embedder,
   searchIndexName: "agents_workspace_skills",
});
