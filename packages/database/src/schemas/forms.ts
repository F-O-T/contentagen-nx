import { relations, sql } from "drizzle-orm";
import {
   boolean,
   index,
   jsonb,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { organization, team } from "./auth";

/**
 * Forms — embeddable form definitions for content pages.
 */
export const forms = pgTable(
   "forms",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      teamId: uuid("team_id")
         .notNull()
         .references(() => team.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      description: text("description"),
      fields: jsonb("fields")
         .$type<
            Array<{
               id: string;
               type:
                  | "text"
                  | "email"
                  | "textarea"
                  | "checkbox"
                  | "select"
                  | "number"
                  | "date"
                  | "rating"
                  | "file";
               label: string;
               placeholder?: string;
               required: boolean;
               options?: string[];
            }>
         >()
         .notNull(),
      settings: jsonb("settings")
         .$type<{
            successMessage?: string;
            redirectUrl?: string;
            sendEmailNotification?: boolean;
            emailRecipients?: string[];
         }>()
         .default({})
         .notNull(),
      title: text("title"),
      subtitle: text("subtitle"),
      icon: text("icon"),
      buttonText: text("button_text").notNull().default("Enviar"),
      layout: text("layout", { enum: ["card", "inline", "banner"] })
         .notNull()
         .default("card"),
      isActive: boolean("is_active").default(true).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [
      index("forms_org_idx").on(table.organizationId),
      index("forms_team_idx").on(table.teamId),
   ],
);

/**
 * Form Submissions — stored submission data.
 */
export const formSubmissions = pgTable(
   "form_submissions",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      formId: uuid("form_id")
         .notNull()
         .references(() => forms.id, { onDelete: "cascade" }),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      teamId: uuid("team_id")
         .notNull()
         .references(() => team.id, { onDelete: "cascade" }),
      data: jsonb("data").$type<Record<string, unknown>>().notNull(),
      metadata: jsonb("metadata").$type<{
         ipAddress?: string;
         userAgent?: string;
         referrer?: string;
         visitorId?: string;
         sessionId?: string;
      }>(),
      submittedAt: timestamp("submitted_at").defaultNow().notNull(),
   },
   (table) => [
      index("form_submissions_form_idx").on(table.formId),
      index("form_submissions_org_idx").on(table.organizationId),
      index("form_submissions_team_idx").on(table.teamId),
   ],
);

export const formsRelations = relations(forms, ({ one, many }) => ({
   organization: one(organization, {
      fields: [forms.organizationId],
      references: [organization.id],
   }),
   team: one(team, {
      fields: [forms.teamId],
      references: [team.id],
   }),
   submissions: many(formSubmissions),
}));

export const formSubmissionsRelations = relations(
   formSubmissions,
   ({ one }) => ({
      form: one(forms, {
         fields: [formSubmissions.formId],
         references: [forms.id],
      }),
      organization: one(organization, {
         fields: [formSubmissions.organizationId],
         references: [organization.id],
      }),
      team: one(team, {
         fields: [formSubmissions.teamId],
         references: [team.id],
      }),
   }),
);

export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type NewFormSubmission = typeof formSubmissions.$inferInsert;
export type FormLayout = "card" | "inline" | "banner";
