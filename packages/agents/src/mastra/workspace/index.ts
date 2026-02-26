import path from "node:path";
import { Workspace, LocalFilesystem } from "@mastra/core/workspace";
import { embed } from "ai";
import { embeddingModel, pgVectorStore } from "../../utils";

const skillsDir = path.resolve(import.meta.dirname, "../../skills");

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
      basePath: skillsDir,
   }),
   skills: ["/"],
   bm25: true,
   vectorStore: pgVectorStore,
   embedder,
   searchIndexName: "agents_workspace_skills",
});
