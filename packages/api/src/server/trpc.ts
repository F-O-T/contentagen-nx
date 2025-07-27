import { initTRPC, TRPCError } from "@trpc/server";
import SuperJSON from "superjson";
import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import type { MinioClient } from "@packages/files/client";
import type { ChromaClient } from "@packages/chroma-db/client";
export const createTRPCContext = async ({
   auth,
   db,
   headers,
   minioClient,
   minioBucket,
   chromaClient,
}: {
   auth: AuthInstance;
   db: DatabaseInstance;
   minioClient: MinioClient;
   minioBucket: string;
   headers: Headers;
   chromaClient: ChromaClient;
}): Promise<{
   minioBucket: string;
   db: DatabaseInstance;
   minioClient: MinioClient;
   chromaClient: ChromaClient;
   session: AuthInstance["$Infer"]["Session"] | null;
}> => {
   console.log("Creating TRPC context with headers:", headers);
   const session = await auth.api.getSession({
      headers,
   });

   return {
      minioBucket,
      minioClient,
      db,
      chromaClient,
      session,
   };
};

export const t = initTRPC
   .context<ReturnType<typeof createTRPCContext>>()
   .create({
      transformer: SuperJSON,
   });

export const router = t.router;
const isAuthed = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;
   if (!resolvedCtx.session?.user) {
      throw new TRPCError({ code: "FORBIDDEN" });
   }
   return next({
      ctx: {
         session: { ...resolvedCtx.session },
      },
   });
});
const timingMiddleware = t.middleware(async ({ next, path }) => {
   const start = Date.now();
   const result = await next();
   const end = Date.now();

   console.info(`[TRPC] ${path} took ${end - start}ms to execute`);

   return result;
});

export const publicProcedure = t.procedure.use(timingMiddleware);
export const protectedProcedure = publicProcedure.use(isAuthed);
