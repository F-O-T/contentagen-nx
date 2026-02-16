import { ORPCError } from "@orpc/server";
import { isOrganizationOwner } from "@packages/database/repositories/auth-repository";
import {
   ssoConfigurations,
   verifiedDomains,
} from "@packages/database/schemas/sso";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

const addDomainSchema = z.object({
   domain: z
      .string()
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/),
});

const configureSAMLSchema = z.object({
   entityId: z.string().url(),
   ssoUrl: z.string().url(),
   certificate: z.string(),
});

const configureOIDCSchema = z.object({
   issuer: z.string().url(),
   clientId: z.string(),
   clientSecret: z.string(),
});

/**
 * Get all verified domains for organization
 */
export const getDomains = protectedProcedure.handler(async ({ context }) => {
   const { db, organizationId } = context;

   const domains = await db.query.verifiedDomains.findMany({
      where: eq(verifiedDomains.organizationId, organizationId),
   });

   return domains.map((d) => ({
      id: d.id,
      domain: d.domain,
      verified: d.verified,
      verifiedAt: d.verifiedAt,
      autoJoinEnabled: d.autoJoinEnabled,
      createdAt: d.createdAt,
   }));
});

/**
 * Add domain for verification
 */
export const addDomain = protectedProcedure
   .input(addDomainSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId, userId } = context;

      // Only owners can add domains
      const isOwner = await isOrganizationOwner(db, userId, organizationId);
      if (!isOwner) {
         throw new ORPCError("FORBIDDEN", {
            message: "Only organization owners can add domains",
         });
      }

      // Check if domain already exists
      const existing = await db.query.verifiedDomains.findFirst({
         where: and(
            eq(verifiedDomains.organizationId, organizationId),
            eq(verifiedDomains.domain, input.domain),
         ),
      });

      if (existing) {
         throw new ORPCError("BAD_REQUEST", {
            message: "Domain already added",
         });
      }

      // Generate verification token
      const verificationToken = `contentta-domain-verification-${crypto.randomUUID()}`;

      const [domain] = await db
         .insert(verifiedDomains)
         .values({
            organizationId,
            domain: input.domain,
            verificationToken,
         })
         .returning();

      return {
         id: domain.id,
         domain: domain.domain,
         verificationToken: domain.verificationToken,
         verified: domain.verified,
      };
   });

/**
 * Verify domain ownership
 */
export const verifyDomain = protectedProcedure
   .input(z.object({ domainId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const domain = await db.query.verifiedDomains.findFirst({
         where: and(
            eq(verifiedDomains.id, input.domainId),
            eq(verifiedDomains.organizationId, organizationId),
         ),
      });

      if (!domain) {
         throw new ORPCError("NOT_FOUND", {
            message: "Domain not found",
         });
      }

      if (domain.verified) {
         throw new ORPCError("BAD_REQUEST", {
            message: "Domain already verified",
         });
      }

      // TODO: Implement actual DNS TXT record verification
      // For now, simulate verification
      const verified = true; // await verifyDNSRecord(domain.domain, domain.verificationToken)

      if (!verified) {
         throw new ORPCError("BAD_REQUEST", {
            message:
               "Domain verification failed. Please ensure the TXT record is correctly configured.",
         });
      }

      const [updated] = await db
         .update(verifiedDomains)
         .set({
            verified: true,
            verifiedAt: new Date(),
         })
         .where(eq(verifiedDomains.id, input.domainId))
         .returning();

      return {
         id: updated.id,
         domain: updated.domain,
         verified: updated.verified,
         verifiedAt: updated.verifiedAt,
      };
   });

/**
 * Remove domain
 */
export const removeDomain = protectedProcedure
   .input(z.object({ domainId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId, userId } = context;

      // Only owners can remove domains
      const isOwner = await isOrganizationOwner(db, userId, organizationId);
      if (!isOwner) {
         throw new ORPCError("FORBIDDEN", {
            message: "Only organization owners can remove domains",
         });
      }

      await db
         .delete(verifiedDomains)
         .where(
            and(
               eq(verifiedDomains.id, input.domainId),
               eq(verifiedDomains.organizationId, organizationId),
            ),
         );

      return { success: true };
   });

/**
 * Toggle auto-join for domain
 */
export const toggleAutoJoin = protectedProcedure
   .input(
      z.object({
         domainId: z.string().uuid(),
         enabled: z.boolean(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId, userId } = context;

      // Only owners can toggle auto-join
      const isOwner = await isOrganizationOwner(db, userId, organizationId);
      if (!isOwner) {
         throw new ORPCError("FORBIDDEN", {
            message: "Only organization owners can configure auto-join",
         });
      }

      const [updated] = await db
         .update(verifiedDomains)
         .set({ autoJoinEnabled: input.enabled })
         .where(
            and(
               eq(verifiedDomains.id, input.domainId),
               eq(verifiedDomains.organizationId, organizationId),
            ),
         )
         .returning();

      return {
         id: updated.id,
         autoJoinEnabled: updated.autoJoinEnabled,
      };
   });

/**
 * Get SSO configurations
 */
export const getConfigurations = protectedProcedure.handler(
   async ({ context }) => {
      const { db, organizationId } = context;

      const configs = await db.query.ssoConfigurations.findMany({
         where: eq(ssoConfigurations.organizationId, organizationId),
      });

      // Redact sensitive fields
      return configs.map((c) => ({
         id: c.id,
         provider: c.provider,
         enabled: c.enabled,
         config: {
            // Return safe config fields only
            ...c.config,
            clientSecret: undefined,
            certificate: undefined,
         },
         createdAt: c.createdAt,
         updatedAt: c.updatedAt,
      }));
   },
);

/**
 * Configure SAML SSO
 */
export const configureSAML = protectedProcedure
   .input(configureSAMLSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId, userId } = context;

      // Only owners can configure SSO
      const isOwner = await isOrganizationOwner(db, userId, organizationId);
      if (!isOwner) {
         throw new ORPCError("FORBIDDEN", {
            message: "Only organization owners can configure SSO",
         });
      }

      // Check if SAML config already exists
      const existing = await db.query.ssoConfigurations.findFirst({
         where: and(
            eq(ssoConfigurations.organizationId, organizationId),
            eq(ssoConfigurations.provider, "saml"),
         ),
      });

      if (existing) {
         // Update existing
         const [updated] = await db
            .update(ssoConfigurations)
            .set({
               config: input,
               updatedAt: new Date(),
            })
            .where(eq(ssoConfigurations.id, existing.id))
            .returning();

         return {
            id: updated.id,
            provider: updated.provider,
            enabled: updated.enabled,
         };
      }

      // Create new
      const [config] = await db
         .insert(ssoConfigurations)
         .values({
            organizationId,
            provider: "saml",
            enabled: false,
            config: input,
         })
         .returning();

      return {
         id: config.id,
         provider: config.provider,
         enabled: config.enabled,
      };
   });

/**
 * Configure OIDC SSO
 */
export const configureOIDC = protectedProcedure
   .input(configureOIDCSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId, userId } = context;

      // Only owners can configure SSO
      const isOwner = await isOrganizationOwner(db, userId, organizationId);
      if (!isOwner) {
         throw new ORPCError("FORBIDDEN", {
            message: "Only organization owners can configure SSO",
         });
      }

      // Check if OIDC config already exists
      const existing = await db.query.ssoConfigurations.findFirst({
         where: and(
            eq(ssoConfigurations.organizationId, organizationId),
            eq(ssoConfigurations.provider, "oidc"),
         ),
      });

      if (existing) {
         // Update existing
         const [updated] = await db
            .update(ssoConfigurations)
            .set({
               config: input,
               updatedAt: new Date(),
            })
            .where(eq(ssoConfigurations.id, existing.id))
            .returning();

         return {
            id: updated.id,
            provider: updated.provider,
            enabled: updated.enabled,
         };
      }

      // Create new
      const [config] = await db
         .insert(ssoConfigurations)
         .values({
            organizationId,
            provider: "oidc",
            enabled: false,
            config: input,
         })
         .returning();

      return {
         id: config.id,
         provider: config.provider,
         enabled: config.enabled,
      };
   });

/**
 * Toggle SSO configuration enabled state
 */
export const toggleConfiguration = protectedProcedure
   .input(
      z.object({
         configId: z.string().uuid(),
         enabled: z.boolean(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId, userId } = context;

      // Only owners can toggle SSO
      const isOwner = await isOrganizationOwner(db, userId, organizationId);
      if (!isOwner) {
         throw new ORPCError("FORBIDDEN", {
            message: "Only organization owners can configure SSO",
         });
      }

      const [updated] = await db
         .update(ssoConfigurations)
         .set({ enabled: input.enabled })
         .where(
            and(
               eq(ssoConfigurations.id, input.configId),
               eq(ssoConfigurations.organizationId, organizationId),
            ),
         )
         .returning();

      return {
         id: updated.id,
         enabled: updated.enabled,
      };
   });
