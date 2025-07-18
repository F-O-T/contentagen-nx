import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

export const KnowledgePointSchema = Type.Object({
   content: Type.String(),
   summary: Type.String(),
   category: Type.Optional(Type.String()),
   keywords: Type.Optional(Type.Array(Type.String())),
   source: Type.Optional(Type.String()),
   confidence: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
});

export const KnowledgePointsArraySchema = Type.Array(KnowledgePointSchema);
export type KnowledgePoint = Static<typeof KnowledgePointSchema>;
export type KnowledgePointsArray = Static<typeof KnowledgePointsArraySchema>;

import { Value } from "@sinclair/typebox/value";
import { InvalidInputError } from "@packages/errors";

export function parseKnowledgePoints(jsonString: string): KnowledgePointsArray {
   let parsed: unknown;
   try {
      parsed = JSON.parse(jsonString);
   } catch (e) {
      throw new InvalidInputError(
         `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
      );
   }
   if (!Value.Check(KnowledgePointsArraySchema, parsed)) {
      throw new InvalidInputError(
         "Parsed value does not match KnowledgePointsArray schema",
      );
   }
   return parsed as KnowledgePointsArray;
}
