import { ORPCError } from "@orpc/server";
import {
   createKey,
   listKeysByUserId,
   revokeKey,
} from "@packages/database/repositories/personal-api-key-repository";
import type {
   OrganizationAccess,
   PersonalApiKeyScopes,
   ScopeAccess,
} from "@packages/database/schemas/personal-api-key";
import { z } from "zod";
import { protectedProcedure } from "../server";

declare const Bun: { password: { hash(pw: string): Promise<string> } };

// =============================================================================
// Constants
// =============================================================================

const KEY_PREFIX_FORMAT = "cta_";
const KEY_RANDOM_LENGTH = 40;
const STORED_PREFIX_LENGTH = 8;

/**
 * Scope resource definitions — each resource that can be granted access via API keys.
 */
const SCOPE_DEFINITIONS = [
   {
      resource: "content",
      label: "Conteúdo",
      description: "Artigos, posts e páginas de conteúdo",
   },
   {
      resource: "agent",
      label: "Agentes IA",
      description: "Escritores e personas de IA",
   },
   {
      resource: "brand",
      label: "Marca",
      description: "Diretrizes e configurações da marca",
   },
   {
      resource: "brand_document",
      label: "Documentos da marca",
      description: "Documentos de referência para contexto da marca",
   },
   {
      resource: "form",
      label: "Formulários",
      description: "Formulários de coleta de dados",
   },
   {
      resource: "form_submission",
      label: "Submissões de formulários",
      description: "Respostas recebidas nos formulários",
   },
   {
      resource: "chat",
      label: "Chat",
      description: "Conversas com agentes de IA",
   },
   {
      resource: "insight",
      label: "Insights",
      description: "Consultas e análises de dados",
   },
   {
      resource: "dashboard",
      label: "Dashboards",
      description: "Painéis de visualização de dados",
   },
   {
      resource: "organization",
      label: "Organização",
      description: "Configurações da organização",
   },
   {
      resource: "member",
      label: "Membros",
      description: "Membros da organização",
   },
   {
      resource: "team",
      label: "Times",
      description: "Times e grupos de trabalho",
   },
   {
      resource: "webhook",
      label: "Webhooks",
      description: "Endpoints de webhook e entregas",
   },
   {
      resource: "event",
      label: "Eventos",
      description: "Eventos e logs de atividade",
   },
   {
      resource: "export",
      label: "Exportação",
      description: "Exportação de conteúdo e dados",
   },
] as const;

/**
 * Preset scope configurations for common use cases.
 */
const SCOPE_PRESETS = [
   {
      id: "full_access",
      label: "Acesso total",
      description: "Leitura e escrita em todos os recursos",
      scopes: Object.fromEntries(
         SCOPE_DEFINITIONS.map((d) => [d.resource, "write" as ScopeAccess]),
      ),
   },
   {
      id: "read_only",
      label: "Somente leitura",
      description: "Leitura em todos os recursos, sem escrita",
      scopes: Object.fromEntries(
         SCOPE_DEFINITIONS.map((d) => [d.resource, "read" as ScopeAccess]),
      ),
   },
   {
      id: "content_sdk",
      label: "SDK de Conteúdo",
      description: "Acesso para integração de conteúdo via SDK",
      scopes: {
         content: "write" as ScopeAccess,
         agent: "read" as ScopeAccess,
         brand: "read" as ScopeAccess,
         brand_document: "read" as ScopeAccess,
         export: "write" as ScopeAccess,
         form: "none" as ScopeAccess,
         form_submission: "none" as ScopeAccess,
         chat: "none" as ScopeAccess,
         insight: "none" as ScopeAccess,
         dashboard: "none" as ScopeAccess,
         organization: "none" as ScopeAccess,
         member: "none" as ScopeAccess,
         team: "none" as ScopeAccess,
         webhook: "none" as ScopeAccess,
         event: "none" as ScopeAccess,
      },
   },
   {
      id: "analytics",
      label: "Analytics",
      description: "Acesso a insights e dashboards de analytics",
      scopes: {
         insight: "write" as ScopeAccess,
         dashboard: "write" as ScopeAccess,
         event: "read" as ScopeAccess,
         content: "none" as ScopeAccess,
         agent: "none" as ScopeAccess,
         brand: "none" as ScopeAccess,
         brand_document: "none" as ScopeAccess,
         form: "none" as ScopeAccess,
         form_submission: "none" as ScopeAccess,
         chat: "none" as ScopeAccess,
         organization: "none" as ScopeAccess,
         member: "none" as ScopeAccess,
         team: "none" as ScopeAccess,
         webhook: "none" as ScopeAccess,
         export: "none" as ScopeAccess,
      },
   },
   {
      id: "form_management",
      label: "Gestão de formulários",
      description: "Acesso completo a formulários e submissões",
      scopes: {
         form: "write" as ScopeAccess,
         form_submission: "write" as ScopeAccess,
         webhook: "read" as ScopeAccess,
         content: "none" as ScopeAccess,
         agent: "none" as ScopeAccess,
         brand: "none" as ScopeAccess,
         brand_document: "none" as ScopeAccess,
         chat: "none" as ScopeAccess,
         insight: "none" as ScopeAccess,
         dashboard: "none" as ScopeAccess,
         organization: "none" as ScopeAccess,
         member: "none" as ScopeAccess,
         team: "none" as ScopeAccess,
         event: "none" as ScopeAccess,
         export: "none" as ScopeAccess,
      },
   },
] as const;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate a random API key with the format: cta_ + 40 alphanumeric chars.
 */
function generateApiKey(): string {
   const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
   const randomBytes = crypto.getRandomValues(
      new Uint8Array(KEY_RANDOM_LENGTH),
   );
   let result = KEY_PREFIX_FORMAT;
   for (let i = 0; i < KEY_RANDOM_LENGTH; i++) {
      result += chars[randomBytes[i] % chars.length];
   }
   return result;
}

// =============================================================================
// Validation Schemas
// =============================================================================

const scopeAccessSchema = z.enum(["none", "read", "write"]);

const createKeySchema = z.object({
   label: z.string().min(1).max(100),
   scopes: z.record(z.string(), scopeAccessSchema),
   organizationAccess: z.union([z.literal("all"), z.array(z.string().uuid())]),
});

const revokeKeySchema = z.object({
   id: z.string().uuid(),
});

// =============================================================================
// Procedures
// =============================================================================

/**
 * Create a new personal API key.
 * Returns the plaintext key ONCE — it is never stored or retrievable again.
 */
export const create = protectedProcedure
   .input(createKeySchema)
   .handler(async ({ context, input }) => {
      const { db, userId } = context;

      const plaintextKey = generateApiKey();
      const keyPrefix = plaintextKey.slice(
         KEY_PREFIX_FORMAT.length,
         KEY_PREFIX_FORMAT.length + STORED_PREFIX_LENGTH,
      );
      const keyHash = await Bun.password.hash(plaintextKey);

      const created = await createKey(db, {
         userId,
         label: input.label,
         keyHash,
         keyPrefix,
         scopes: input.scopes as PersonalApiKeyScopes,
         organizationAccess: input.organizationAccess as OrganizationAccess,
      });

      return {
         id: created.id,
         label: created.label,
         keyPrefix: created.keyPrefix,
         plaintextKey,
         createdAt: created.createdAt,
      };
   });

/**
 * List all personal API keys for the current user.
 * Never returns the key hash — only the masked prefix.
 */
export const list = protectedProcedure.handler(async ({ context }) => {
   const { db, userId } = context;

   const keys = await listKeysByUserId(db, userId);

   return keys.map((key) => ({
      id: key.id,
      label: key.label,
      maskedKey: `cta_${key.keyPrefix}...`,
      scopes: key.scopes,
      organizationAccess: key.organizationAccess,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
   }));
});

/**
 * Revoke (delete) a personal API key. Only the key owner can revoke.
 */
export const revoke = protectedProcedure
   .input(revokeKeySchema)
   .handler(async ({ context, input }) => {
      const { db, userId } = context;

      const deleted = await revokeKey(db, input.id, userId);

      if (!deleted) {
         throw new ORPCError("NOT_FOUND", {
            message: "Chave de API não encontrada.",
         });
      }

      return { success: true };
   });

/**
 * Get the static list of scope resource definitions and presets.
 */
export const getScopeDefinitions = protectedProcedure.handler(async () => {
   return {
      definitions: SCOPE_DEFINITIONS.map((d) => ({
         resource: d.resource,
         label: d.label,
         description: d.description,
      })),
      presets: SCOPE_PRESETS.map((p) => ({
         id: p.id,
         label: p.label,
         description: p.description,
         scopes: p.scopes,
      })),
   };
});
