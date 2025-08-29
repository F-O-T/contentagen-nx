import { relations } from "drizzle-orm";
import {
   index,
   jsonb,
   pgEnum,
   pgTable,
   text,
   timestamp,
   uuid,
   boolean,
} from "drizzle-orm/pg-core";
import {
   createInsertSchema,
   createSelectSchema,
   createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth";
import { agent } from "./agent";

export const memoryTypeEnum = pgEnum("memory_type", [
   "conversation_history", // Past conversations and user interactions
   "user_feedback", // Explicit user feedback on generated content
   "performance_insight", // What worked well or poorly in past generations
   "context_pattern", // Patterns in user requests or preferences
   "error_recovery", // How the agent handled and recovered from errors
   "success_pattern", // Patterns that led to successful content generation
   "adaptation", // How the agent adapted to user preferences over time
]);

export type MemoryType = (typeof memoryTypeEnum.enumValues)[number];

export const MemoryContentSchema = z.object({
   title: z.string().optional(),
   description: z.string().optional(),
   content: z.string(),
   tags: z.array(z.string()).optional(),
   importance: z.number().min(1).max(10).optional(),
   confidence: z.number().min(0).max(1).optional(), // How confident the agent is in this memory
   frequency: z.number().optional(), // How often this pattern occurs
   last_used: z.string().optional(), // When this memory was last applied
});

export const memory = pgTable(
   "memory",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      agentId: uuid("agent_id").references(() => agent.id, {
         onDelete: "cascade",
      }),
      userId: text("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      type: memoryTypeEnum("type").notNull(),
      content: jsonb("content").$type<MemoryContent>().notNull(),
      isActive: boolean("is_active")
         .$defaultFn(() => true)
         .notNull(),
      expiresAt: timestamp("expires_at"),
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),
      updatedAt: timestamp("updated_at")
         .$defaultFn(() => new Date())
         .notNull(),
   },
   (table) => [
      index("memory_agent_id_idx").on(table.agentId),
      index("memory_user_id_idx").on(table.userId),
      index("memory_type_idx").on(table.type),
      index("memory_created_at_idx").on(table.createdAt),
   ],
);

export const memoryRelations = relations(memory, ({ one }) => ({
   agent: one(agent, {
      fields: [memory.agentId],
      references: [agent.id],
   }),
   user: one(user, {
      fields: [memory.userId],
      references: [user.id],
   }),
}));

export type MemorySelect = typeof memory.$inferSelect;
export type MemoryInsert = typeof memory.$inferInsert;

export const MemoryInsertSchema = createInsertSchema(memory);
export const MemorySelectSchema = createSelectSchema(memory);
export const MemoryUpdateSchema = createUpdateSchema(memory);

export type MemoryContent = z.infer<typeof MemoryContentSchema>;
