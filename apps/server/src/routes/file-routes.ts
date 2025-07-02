import { authMiddleware } from "@api/integrations/auth";
import { Elysia, t } from "elysia";
import { getFile, getFileInfo } from "../integrations/minio";
import { NotFoundError } from "../shared/errors";

export const fileRoutes = new Elysia({
   prefix: "/files",
})
   .use(authMiddleware)
   .get(
      "/:filename",
      async ({ params, set }) => {
         try {
            // Get file info for headers
            const fileInfo = await getFileInfo(params.filename);

            // Get file stream
            const stream = await getFile(params.filename);

            // Set appropriate headers
            set.headers["Content-Type"] = fileInfo.contentType;
            set.headers["Content-Length"] = fileInfo.size.toString();
            set.headers["Cache-Control"] = "public, max-age=31536000"; // Cache for 1 year

            return new Response(stream as any, {
               headers: {
                  "Content-Type": fileInfo.contentType,
                  "Content-Length": fileInfo.size.toString(),
                  "Cache-Control": "public, max-age=31536000",
               },
            });
         } catch (error) {
            throw new NotFoundError("File not found", "FILE_NOT_FOUND");
         }
      },
      {
         auth: true,
         params: t.Object({
            filename: t.String(),
         }),
      },
   );
