import { Client } from "minio";
import type { Static } from "@sinclair/typebox";
import { Type } from "@sinclair/typebox";
const parseEndpoint = (endpoint: string) => {
   // Remove protocol if present
   const cleanEndpoint = endpoint.replace(/^https?:\/\//, "");

   // Split host and port
   const [host, portStr] = cleanEndpoint.split(":");

   return {
      endPoint: host || "localhost",
      port: portStr
         ? parseInt(portStr, 10)
         : endpoint.includes("https")
           ? 443
           : 9000,
   };
};
const EnvSchema = Type.Object({
   MINIO_ENDPOINT: Type.String(),
   MINIO_ACCESS_KEY: Type.String(),
   MINIO_SECRET_KEY: Type.String(),
   MINIO_BUCKET: Type.String(),
});
export function getMinioClient(env: Static<typeof EnvSchema>) {
   const { endPoint, port } = parseEndpoint(env.MINIO_ENDPOINT);

   const internalClient = new Client({
      endPoint,
      port,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
      useSSL: false, // Set to true in production with HTTPS
   });
   return internalClient;
}
export type MinioClient = ReturnType<typeof getMinioClient>;
export async function uploadFile(
   fileName: string,
   fileBuffer: Buffer,
   contentType: string,
   bucketName: string,
   minioClient: MinioClient,
): Promise<string> {
   const bucketExists = await minioClient.bucketExists(bucketName);
   if (!bucketExists) {
      await minioClient.makeBucket(bucketName);
   }
   // Generate unique filename with timestamp
   const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
   const uniqueFileName = `${timestamp}_${fileName}`;
   // Upload file
   await minioClient.putObject(
      bucketName,
      uniqueFileName,
      fileBuffer,
      fileBuffer.length,
      {
         "Content-Type": contentType,
      },
   );
   // Return the file URL (now using server proxy)
   return `/api/v1/files/${uniqueFileName}`;
}

export async function getFile(
   fileName: string,
   bucketName: string,
   minioClient: MinioClient,
): Promise<NodeJS.ReadableStream> {
   // Get file from MinIO
   const stream = await minioClient.getObject(bucketName, fileName);
   return stream;
}

export async function getFileInfo(
   fileName: string,
   bucketName: string,
   minioClient: MinioClient,
): Promise<{ size: number; contentType: string }> {
   const stat = await minioClient.statObject(bucketName, fileName);
   return { size: stat.size, contentType: stat.metaData["content-type"] };
}
