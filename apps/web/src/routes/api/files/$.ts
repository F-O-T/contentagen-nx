import { env } from "@packages/environment/server";
import { getMinioClient } from "@packages/files/client";
import { createFileRoute } from "@tanstack/react-router";

async function handle({
   request: _request,
   params,
}: {
   request: Request;
   params: { _splat?: string };
}) {
   try {
      const path = params._splat || "";
      const [bucketName, ...fileNameParts] = path.split("/");
      const fileName = fileNameParts.join("/");

      if (!bucketName || !fileName) {
         return new Response("Invalid file path", { status: 400 });
      }

      // Get MinIO client
      const minioClient = getMinioClient(env);

      // Stream file from MinIO
      const stream = await minioClient.getObject(bucketName, fileName);

      // Get file stats for content type
      const stat = await minioClient.statObject(bucketName, fileName);

      // Convert Node.js stream to Web ReadableStream
      const webStream = new ReadableStream({
         start(controller) {
            stream.on("data", (chunk: Buffer) => {
               controller.enqueue(new Uint8Array(chunk));
            });
            stream.on("end", () => {
               controller.close();
            });
            stream.on("error", (error) => {
               controller.error(error);
            });
         },
      });

      // Return file with appropriate headers
      return new Response(webStream, {
         headers: {
            "Content-Type":
               stat.metaData?.["content-type"] || "application/octet-stream",
            "Content-Length": stat.size.toString(),
            "Cache-Control": "public, max-age=31536000, immutable",
         },
      });
   } catch (error) {
      console.error("[Files API] Error serving file:", error);
      return new Response("File not found", { status: 404 });
   }
}

export const Route = createFileRoute("/api/files/$")({
   server: {
      handlers: {
         HEAD: handle,
         GET: handle,
      },
   },
});
