import { uploadFile, getMinioClient } from "@packages/files/client";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { updateAgent } from "@packages/database/repositories/agent-repository";

interface UploadBrandChunksPayload {
   agentId: string;
   chunks: string[];
}

const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
const minioClient = getMinioClient(serverEnv);
export async function runUploadBrandChunks(payload: UploadBrandChunksPayload) {
   const { agentId, chunks } = payload;
   const bucketName = serverEnv.MINIO_BUCKET;
   const uploadedFiles: Array<{
      fileName: string;
      fileUrl: string;
      uploadedAt: string;
      rawContent: string;
   }> = [];

   for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk) continue;
      const fileName = `brand-chunk-${i + 1}.md`;
      const fileBuffer = Buffer.from(chunk, "utf-8");
      const key = `${agentId}/${fileName}`;
      await uploadFile(
         key,
         fileBuffer,
         "text/markdown",
         bucketName,
         minioClient,
      );
      uploadedFiles.push({
         fileName,
         fileUrl: key,
         uploadedAt: new Date().toISOString(),
         rawContent: chunk,
      });
   }

   const filesForDb = uploadedFiles.map(({ rawContent, ...rest }) => rest);
   await updateAgent(db, agentId, { uploadedFiles: filesForDb });

   // Return processed chunk array (uploaded files)
   return { uploadedFiles };
}
