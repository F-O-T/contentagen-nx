import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { ORPCError } from "@orpc/server";
import {
   createAsset,
   deleteAsset,
   getAssetById,
   listAssets,
   updateAsset,
} from "@packages/database/repositories/asset-repository";
import { getProductSettings } from "@packages/database/repositories/product-settings-repository";
import { env as serverEnv } from "@packages/environment/server";
import {
   emitAssetDeleted,
   emitAssetUploadCompleted,
} from "@packages/events/assets";
import { AI_EVENTS, emitAiImageGeneration } from "@packages/events/ai";
import { enforceCreditBudget, trackCreditUsage } from "@packages/events/credits";
import { getImageGenerationPrice } from "@packages/events/pricing";
import {
   deleteFile,
   generatePresignedPutUrl,
   getMinioClient,
   uploadFile,
} from "@packages/files/client";
import { nanoid } from "nanoid";
import { generateImage as aiGenerateImage } from "ai";
import { z } from "zod";
import { protectedProcedure } from "../server";

const IMAGE_ASPECT_RATIOS = [
   "1:1",
   "16:9",
   "9:16",
   "3:2",
] as const;
const ASPECT_TO_SIZE: Record<(typeof IMAGE_ASPECT_RATIOS)[number], string> = {
   "1:1": "1024x1024",
   "16:9": "1920x1080",
   "9:16": "1080x1920",
   "3:2": "1536x1024",
};
const DEFAULT_IMAGE_MODEL = "sourceful/riverflow-v2-pro";

export const generateUploadUrl = protectedProcedure
   .input(
      z.object({
         teamId: z.string().uuid().optional(),
         filename: z.string(),
         mimeType: z.string(),
         size: z.number().int().positive(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { organizationId } = context;

      try {
         const minioClient = getMinioClient(serverEnv);
         const bucket = serverEnv.MINIO_BUCKET ?? "contentta";
         const ext = input.filename.includes(".")
            ? input.filename.split(".").pop()
            : "";
         const fileKey = ext
            ? `orgs/${organizationId}/assets/${nanoid()}.${ext}`
            : `orgs/${organizationId}/assets/${nanoid()}`;

         const presignedUrl = await generatePresignedPutUrl(
            fileKey,
            bucket,
            minioClient,
            300,
         );

         const publicUrl = `/api/files/${bucket}/${fileKey}`;

         return { presignedUrl, fileKey, publicUrl };
      } catch (error) {
         console.error("Failed to generate presigned URL:", error);
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to generate upload URL",
         });
      }
   });

export const completeUpload = protectedProcedure
   .input(
      z.object({
         teamId: z.string().uuid().optional(),
         fileKey: z.string(),
         publicUrl: z.string(),
         filename: z.string(),
         mimeType: z.string(),
         size: z.number().int().positive(),
         width: z.number().int().optional(),
         height: z.number().int().optional(),
         alt: z.string().optional(),
         caption: z.string().optional(),
         tags: z.array(z.string()).optional(),
      }),
   )
   .handler(async ({ context, input }) => {
      const {
         db,
         organizationId,
         userId,
         posthog,
         teamId: contextTeamId,
      } = context;
      const bucket = serverEnv.MINIO_BUCKET ?? "contentta";

      const asset = await createAsset(db, {
         organizationId,
         teamId: input.teamId ?? contextTeamId,
         fileKey: input.fileKey,
         bucket,
         filename: input.filename,
         mimeType: input.mimeType,
         size: input.size,
         width: input.width,
         height: input.height,
         alt: input.alt,
         caption: input.caption,
         tags: input.tags ?? [],
         publicUrl: input.publicUrl,
         uploaderId: userId,
      });

      emitAssetUploadCompleted(
         {
            db,
            posthog,
            organizationId,
            userId,
            teamId: input.teamId ?? contextTeamId,
         },
         {
            assetId: asset.id,
            filename: asset.filename,
            mimeType: asset.mimeType,
            size: asset.size,
            uploaderId: userId,
         },
      );

      return asset;
   });

export const list = protectedProcedure
   .input(
      z.object({
         teamId: z.string().uuid().nullable().optional(),
         search: z.string().optional(),
         tags: z.array(z.string()).optional(),
         limit: z.number().int().min(1).max(100).default(24),
         offset: z.number().int().min(0).default(0),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const { items, total } = await listAssets(db, {
         organizationId,
         teamId: input.teamId,
         search: input.search,
         tags: input.tags,
         limit: input.limit,
         offset: input.offset,
      });

      return { assets: items, total };
   });

export const get = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const asset = await getAssetById(db, input.id, organizationId);

      if (!asset) {
         throw new ORPCError("NOT_FOUND", { message: "Asset not found" });
      }

      return asset;
   });

export const update = protectedProcedure
   .input(
      z.object({
         id: z.string().uuid(),
         filename: z.string().min(1).optional(),
         alt: z.string().optional(),
         caption: z.string().optional(),
         tags: z.array(z.string()).optional(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const { id, ...data } = input;

      return updateAsset(db, id, organizationId, data);
   });

export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId, userId, posthog, teamId } = context;

      const asset = await getAssetById(db, input.id, organizationId);

      if (!asset) {
         throw new ORPCError("NOT_FOUND", { message: "Asset not found" });
      }

      try {
         const minioClient = getMinioClient(serverEnv);
         await deleteFile(asset.fileKey, asset.bucket, minioClient);
      } catch (error) {
         console.error(
            "Failed to delete file from storage (best-effort):",
            error,
         );
      }

      await deleteAsset(db, input.id, organizationId);

      emitAssetDeleted(
         { db, posthog, organizationId, userId, teamId },
         { assetId: input.id },
      );

      return { success: true };
   });

export const generateImage = protectedProcedure
   .input(
      z.object({
         prompt: z.string().min(1).max(1000),
         teamId: z.string().uuid().optional(),
         model: z.string().optional(),
         aspectRatio: z.enum(IMAGE_ASPECT_RATIOS).optional(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId, userId, posthog, teamId: contextTeamId } =
         context;

      try {
         await enforceCreditBudget(db, organizationId, "ai");
      } catch (error) {
         throw new ORPCError("FORBIDDEN", {
            message:
               error instanceof Error
                  ? error.message
                  : "Créditos insuficientes para gerar imagem.",
         });
      }

      if (!serverEnv.OPENROUTER_API_KEY) {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Geração de imagens não configurada",
         });
      }

      const teamId = input.teamId ?? contextTeamId;
      const model =
         input.model ??
         (teamId
            ? (await getProductSettings(db, teamId))?.aiDefaults
                  ?.imageGenerationModel ?? DEFAULT_IMAGE_MODEL
            : DEFAULT_IMAGE_MODEL);
      const size = input.aspectRatio
         ? ASPECT_TO_SIZE[input.aspectRatio]
         : ASPECT_TO_SIZE["1:1"];

      const startedAt = Date.now();
      const openrouter = createOpenRouter({
         apiKey: serverEnv.OPENROUTER_API_KEY,
      });
      const imageModel = openrouter.imageModel(model);

      const { image } = await aiGenerateImage({
         model: imageModel,
         prompt: input.prompt,
         size,
      });

      const imageBuffer = Buffer.from(image.uint8Array);
      const mimeType = "image/png";
      const ext = "png";
      const filename = `ai-generated-${nanoid()}.${ext}`;
      const fileKey = `orgs/${organizationId}/assets/${filename}`;
      const bucket = serverEnv.MINIO_BUCKET ?? "contentta";
      const minioClient = getMinioClient(serverEnv);

      let asset: Awaited<ReturnType<typeof createAsset>>;
      try {
         await uploadFile(fileKey, imageBuffer, mimeType, bucket, minioClient);

         const publicUrl = `/api/files/${bucket}/${fileKey}`;

         asset = await createAsset(db, {
            organizationId,
            teamId,
            fileKey,
            bucket,
            filename,
            mimeType,
            size: imageBuffer.length,
            width: undefined,
            height: undefined,
            publicUrl,
            uploaderId: userId,
            tags: ["ai-generated"],
         });
      } catch (err) {
         console.error("Failed to store generated image:", err);
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Falha ao salvar imagem gerada.",
         });
      }

      emitAiImageGeneration(
         { db, posthog, organizationId, userId, teamId },
         {
            assetId: asset.id,
            prompt: input.prompt,
            model,
            latencyMs: Date.now() - startedAt,
            fileSizeBytes: imageBuffer.length,
            mimeType,
         },
      );

      await trackCreditUsage(
         db,
         AI_EVENTS["ai.image_generation"],
         organizationId,
         "ai",
         { priceMinorUnits: Number(getImageGenerationPrice(model).amount) },
      );

      return asset;
   });
