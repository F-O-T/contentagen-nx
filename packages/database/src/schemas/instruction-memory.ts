import { z } from "zod";

/**
 * Schema for individual instruction memory items.
 * These are markdown-based instructions that serve as "memories" for AI agents.
 */
export const InstructionMemoryItemSchema = z.object({
   id: z.string().uuid(),
   title: z.string().min(1).max(200),
   content: z.string(), // Free-form markdown
   enabled: z.boolean().default(true),
   order: z.number().int().min(0).default(0),
   createdAt: z.string().datetime().optional(),
   updatedAt: z.string().datetime().optional(),
});

export type InstructionMemoryItem = z.infer<typeof InstructionMemoryItemSchema>;

/**
 * Schema for an array of instruction memory items.
 * Used for storage in JSONB columns.
 */
export const InstructionMemoryArraySchema = z.array(
   InstructionMemoryItemSchema,
);

export type InstructionMemoryArray = z.infer<
   typeof InstructionMemoryArraySchema
>;

/**
 * Schema for creating a new instruction memory item.
 * ID and timestamps are generated automatically.
 */
export const CreateInstructionMemorySchema = z.object({
   title: z.string().min(1).max(200),
   content: z.string(),
   enabled: z.boolean().default(true),
   order: z.number().int().min(0).optional(),
});

export type CreateInstructionMemory = z.infer<
   typeof CreateInstructionMemorySchema
>;

/**
 * Schema for updating an existing instruction memory item.
 * All fields are optional.
 */
export const UpdateInstructionMemorySchema = z.object({
   title: z.string().min(1).max(200).optional(),
   content: z.string().optional(),
   enabled: z.boolean().optional(),
   order: z.number().int().min(0).optional(),
});

export type UpdateInstructionMemory = z.infer<
   typeof UpdateInstructionMemorySchema
>;
