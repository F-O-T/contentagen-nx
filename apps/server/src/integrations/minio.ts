import { Client } from "minio";
import { env } from "../config/env";

// Parse the MinIO endpoint to extract host and port
const parseEndpoint = (endpoint: string) => {
   // Remove protocol if present
   const cleanEndpoint = endpoint.replace(/^https?:\/\//, '');
   
   // Split host and port
   const [host, portStr] = cleanEndpoint.split(':');
   
   return {
      endPoint: host || 'localhost',
      port: portStr ? parseInt(portStr, 10) : (endpoint.includes('https') ? 443 : 9000),
   };
};

const { endPoint, port } = parseEndpoint(env.MINIO_ENDPOINT);

export const minioClient = new Client({
   endPoint,
   port,
   accessKey: env.MINIO_ACCESS_KEY,
   secretKey: env.MINIO_SECRET_KEY,
   useSSL: false, // Set to true in production with HTTPS
});

export async function uploadFile(
   fileName: string,
   fileBuffer: Buffer,
   contentType: string,
): Promise<string> {
   const bucketName = env.MINIO_BUCKET;
   
   // Ensure bucket exists
   const bucketExists = await minioClient.bucketExists(bucketName);
   if (!bucketExists) {
      await minioClient.makeBucket(bucketName);
   }

   // Generate unique filename with timestamp
   const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
   const uniqueFileName = `${timestamp}_${fileName}`;

   // Upload file
   await minioClient.putObject(bucketName, uniqueFileName, fileBuffer, fileBuffer.length, {
      "Content-Type": contentType,
   });

   // Return the file URL (now using server proxy)
   return `/api/v1/files/${uniqueFileName}`;
}

export async function getFile(fileName: string): Promise<NodeJS.ReadableStream> {
   const bucketName = env.MINIO_BUCKET;
   
   // Get file from MinIO
   const stream = await minioClient.getObject(bucketName, fileName);
   return stream;
}

export async function getFileInfo(fileName: string): Promise<{ size: number; contentType: string }> {
   const bucketName = env.MINIO_BUCKET;
   
   // Get file metadata
   const stat = await minioClient.statObject(bucketName, fileName);
   return {
      size: stat.size,
      contentType: stat.metaData['content-type'] || 'application/octet-stream',
   };
}