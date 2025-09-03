import { initTRPC, TRPCError } from "@trpc/server";
import type { Polar } from "@polar-sh/sdk";
import SuperJSON from "superjson";
import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import type { MinioClient } from "@packages/files/client";
import type { ChromaClient } from "@packages/chroma-db/client";
import type { OpenRouterClient } from "@packages/openrouter/client";
import { ensureCollections } from "@packages/chroma-db/helpers";
import {
   findMemberByUserId,
   isOrganizationOwner,
} from "@packages/database/repositories/auth-repository";
import { getCustomerState } from "@packages/payment/ingestion";

export const createTRPCContext = async ({
   auth,
   polarClient,
   db,
   headers,
   minioClient,
   minioBucket,
   chromaClient,
   openRouterClient,
}: {
   openRouterClient: OpenRouterClient; // Replace with actual type if available
   auth: AuthInstance;
   db: DatabaseInstance;
   minioClient: MinioClient;
   minioBucket: string;
   headers: Headers;
   chromaClient: ChromaClient;
   polarClient: Polar;
}): Promise<{
   polarClient: Polar;
   openRouterClient: OpenRouterClient; // Pass the OpenRouter client to the context
   minioBucket: string;
   db: DatabaseInstance;
   minioClient: MinioClient;
   chromaClient: ChromaClient;
   auth: AuthInstance;
   headers: Headers;
   session: AuthInstance["$Infer"]["Session"] | null;
}> => {
   const session = await auth.api.getSession({
      headers,
   });
   await ensureCollections(chromaClient);
   return {
      openRouterClient,
      polarClient,
      minioBucket,
      minioClient,
      db,
      chromaClient,
      session,
      auth,
      headers,
   };
};

export const t = initTRPC
   .context<ReturnType<typeof createTRPCContext>>()
   .create({
      transformer: SuperJSON,
   });

export const router = t.router;

const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
   console.log(`Request: ${type} ${path}`);
   const start = Date.now();
   const result = await next();
   const durationMs = Date.now() - start;
   console.log(`Response: ${type} ${path} - ${durationMs}ms`);
   return result;
});

const isAuthed = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;
   const apikey = resolvedCtx.headers.get("sdk-api-key");

   if (apikey) {
      throw new TRPCError({
         code: "FORBIDDEN",
         message: "This endpoint does not accept API Key authentication.",
      });
   }
   if (!resolvedCtx.session?.user) {
      throw new TRPCError({ code: "FORBIDDEN" });
   }
   return next({
      ctx: {
         session: { ...resolvedCtx.session },
      },
   });
});

const sdkAuth = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;
   // 1. Get the Authorization header from the incoming request.
   const authHeader = resolvedCtx.headers.get("sdk-api-key");
   if (!authHeader) {
      throw new TRPCError({
         code: "UNAUTHORIZED",
         message: "Missing API Key.",
      });
   }

   const apiKeyData = await resolvedCtx.auth.api.verifyApiKey({
      headers: resolvedCtx.headers,
      body: { key: authHeader },
   });

   if (!apiKeyData.valid) {
      throw new TRPCError({
         code: "UNAUTHORIZED",
         message: "Invalid API Key.",
      });
   }
   const session = await resolvedCtx.auth.api.getSession({
      headers: new Headers({
         "sdk-api-key": authHeader,
      }),
   });
   return next({
      ctx: {
         session: {
            ...session,
         },
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

const hasOrganizationAccess = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;

   // First ensure user is authenticated
   if (!resolvedCtx.session?.user) {
      throw new TRPCError({ code: "FORBIDDEN" });
   }

   const userId = resolvedCtx.session.user.id;

   // First check if user is part of an organization
   const memberWithOrg = await findMemberByUserId(resolvedCtx.db, userId);

   if (memberWithOrg) {
      // User is part of organization - check if organization owner has subscription
      const ownerMember = await resolvedCtx.db.query.member.findFirst({
         where: (member, { eq, and }) =>
            and(
               eq(member.organizationId, memberWithOrg.organizationId),
               eq(member.role, "owner"),
            ),
      });

      if (!ownerMember) {
         throw new TRPCError({
            code: "FORBIDDEN",
            message: "Organization has no owner",
         });
      }

      const ownerState = await getCustomerState(
         resolvedCtx.polarClient,
         ownerMember.userId,
      );

      if (!ownerState.activeSubscriptions) {
         throw new TRPCError({
            code: "FORBIDDEN",
            message: "Organization owner must have an active subscription",
         });
      }

      return next({
         ctx: {
            session: { ...resolvedCtx.session },
         },
      });
   } else {
      // User is not part of any organization - check their own subscription
      const customerState = await resolvedCtx.auth.api.state({
         headers: resolvedCtx.headers,
      });

      if (!customerState.activeSubscriptions) {
         throw new TRPCError({
            code: "FORBIDDEN",
            message: "Active subscription required",
         });
      }

      return next({
         ctx: {
            session: { ...resolvedCtx.session },
            customerState,
         },
      });
   }
});

const hasOrganizationOwnerAccess = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;

   // First ensure user is authenticated
   if (!resolvedCtx.session?.user) {
      throw new TRPCError({ code: "FORBIDDEN" });
   }

   const userId = resolvedCtx.session.user.id;

   const memberWithOrg = await findMemberByUserId(resolvedCtx.db, userId);

   if (memberWithOrg) {
      // Check if user is the owner of the organization
      const isOwner = await isOrganizationOwner(
         resolvedCtx.db,
         userId,
         memberWithOrg.organizationId,
      );

      if (!isOwner) {
         throw new TRPCError({
            code: "FORBIDDEN",
            message: "User is not the owner of the organization",
         });
      }

      const customerState = await resolvedCtx.auth.api.state({
         headers: resolvedCtx.headers,
      });

      if (!customerState.activeSubscriptions) {
         throw new TRPCError({
            code: "FORBIDDEN",
            message: "Active subscription required",
         });
      }
      return next({
         ctx: {
            session: { ...resolvedCtx.session },
         },
      });
   } else {
      // User is not part of any organization - check their own subscription
      const customerState = await resolvedCtx.auth.api.state({
         headers: resolvedCtx.headers,
      });

      if (!customerState.activeSubscriptions) {
         throw new TRPCError({
            code: "FORBIDDEN",
            message: "Active subscription required",
         });
      }

      return next({
         ctx: {
            session: { ...resolvedCtx.session },
         },
      });
   }
});

export const publicProcedure = t.procedure
   .use(loggerMiddleware)
   .use(timingMiddleware);
export const protectedProcedure = publicProcedure.use(isAuthed);
export const sdkProcedure = publicProcedure.use(sdkAuth);

// Organization-specific procedures
export const organizationProcedure = protectedProcedure.use(
   hasOrganizationAccess,
);
export const organizationOwnerProcedure = protectedProcedure.use(
   hasOrganizationOwnerAccess,
);
