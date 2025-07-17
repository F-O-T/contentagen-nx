import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

export const KnowledgePointSchema = Type.Object({
   agentId: Type.String(),
   sourceType: Type.String(),
   content: Type.String(),
   summary: Type.String(),
   category: Type.Optional(
      Type.Union([
         Type.Literal("brand_guideline"),
         Type.Literal("product_spec"),
         Type.Literal("market_insight"),
         Type.Literal("technical_instruction"),
         Type.Literal("custom"),
      ]),
   ),
   keywords: Type.Optional(Type.Array(Type.String())),
   source: Type.Optional(Type.String()),
   confidence: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
});

export type KnowledgePoint = Static<typeof KnowledgePointSchema>;
