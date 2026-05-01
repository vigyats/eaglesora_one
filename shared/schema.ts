import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =====================================
// AUTH
// =====================================

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique(),
  email: varchar("email").unique().notNull(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// =====================================
// APP MODELS
// =====================================

export const adminRoleEnum = pgEnum("admin_role", ["super_admin", "admin"]);

export const admins = pgTable(
  "admins",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: adminRoleEnum("role").notNull().default("admin"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [index("IDX_admins_user_id").on(table.userId)],
);

export const contentLanguageEnum = pgEnum("content_language", ["en", "hi", "mr"]);
export const contentStatusEnum = pgEnum("content_status", ["draft", "published"]);

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    isFeatured: boolean("is_featured").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),
    coverImagePath: text("cover_image_path"),
    youtubeUrl: text("youtube_url"),
    galleryImages: jsonb("gallery_images").$type<string[]>(),
    projectDate: timestamp("project_date"),
    createdByAdminId: integer("created_by_admin_id").references(() => admins.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("IDX_projects_featured").on(table.isFeatured),
    index("IDX_projects_slug").on(table.slug),
  ],
);

export const projectTranslations = pgTable(
  "project_translations",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    language: contentLanguageEnum("language").notNull(),
    status: contentStatusEnum("status").notNull().default("draft"),
    title: text("title").notNull(),
    summary: text("summary"),
    contentHtml: text("content_html").notNull(),
  },
  (table) => [
    index("IDX_project_translations_project_id").on(table.projectId),
    index("IDX_project_translations_language").on(table.language),
  ],
);

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    registrationStartDate: timestamp("registration_start_date"),
    registrationEndDate: timestamp("registration_end_date"),
    coverImagePath: text("cover_image_path"),
    flyerImagePath: text("flyer_image_path"),
    registrationFormUrl: text("registration_form_url"),
    registrationFormFields: jsonb("registration_form_fields"),
    eventPrice: text("event_price"),
    participationType: text("participation_type"),
    flyerText: text("flyer_text"),
    galleryImages: jsonb("gallery_images").$type<string[]>(),
    isFeatured: boolean("is_featured").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),
    registrationOpen: boolean("registration_open").notNull().default(true),
    createdByAdminId: integer("created_by_admin_id").references(() => admins.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("IDX_events_slug").on(table.slug)],
);

export const eventTranslations = pgTable(
  "event_translations",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    language: contentLanguageEnum("language").notNull(),
    status: contentStatusEnum("status").notNull().default("draft"),
    title: text("title").notNull(),
    location: text("location"),
    summary: text("summary"),
    introduction: text("introduction"),
    requirements: text("requirements"),
    contentHtml: text("content_html").notNull(),
  },
  (table) => [
    index("IDX_event_translations_event_id").on(table.eventId),
    index("IDX_event_translations_language").on(table.language),
  ],
);

export const donations = pgTable(
  "donations",
  {
    id: serial("id").primaryKey(),
    donorName: varchar("donor_name", { length: 255 }).notNull(),
    donorEmail: varchar("donor_email", { length: 255 }).notNull(),
    amount: integer("amount").notNull(),
    transactionId: varchar("transaction_id", { length: 100 }).notNull().unique(),
    status: varchar("status", { length: 50 }).notNull().default("completed"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("IDX_donations_email").on(table.donorEmail),
    index("IDX_donations_created_at").on(table.createdAt),
  ],
);

export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    formData: jsonb("form_data").notNull(),
    registeredAt: timestamp("registered_at").notNull().defaultNow(),
  },
  (table) => [index("IDX_event_registrations_event_id").on(table.eventId)],
);

export const youtubeVideos = pgTable("youtube_videos", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  titleHi: text("title_hi"),
  titleMr: text("title_mr"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type YoutubeVideo = typeof youtubeVideos.$inferSelect;
export type InsertYoutubeVideo = typeof youtubeVideos.$inferInsert;

// =====================================
// ZOD INSERT SCHEMAS
// =====================================

export const insertAdminSchema = createInsertSchema(admins).omit({ id: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProjectTranslationSchema = createInsertSchema(projectTranslations).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEventTranslationSchema = createInsertSchema(eventTranslations).omit({ id: true });
export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({ id: true, registeredAt: true });

// =====================================
// EXPLICIT API CONTRACT TYPES
// =====================================

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ProjectTranslation = typeof projectTranslations.$inferSelect;
export type InsertProjectTranslation = z.infer<typeof insertProjectTranslationSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventTranslation = typeof eventTranslations.$inferSelect;
export type InsertEventTranslation = z.infer<typeof insertEventTranslationSchema>;

export type Donation = typeof donations.$inferSelect;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;

export type CreateAdminRequest = {
  username: string;
  email: string;
  password: string;
  role: "super_admin" | "admin";
};

export type CreateAdminDbRequest = {
  userId: string;
  role: "super_admin" | "admin";
};

export type UpdateAdminRequest = Partial<{
  role: "super_admin" | "admin";
  isActive: boolean;
}>;

export type CreateProjectRequest = {
  slug: string;
  isFeatured?: boolean;
  projectDate?: string | null;
  coverImagePath?: string | null;
  youtubeUrl?: string | null;
  galleryImages?: string[] | null;
  translations: Array<{
    language: "en" | "hi" | "mr";
    status?: "draft" | "published";
    title: string;
    summary?: string | null;
    contentHtml: string;
  }>;
};

export type UpdateProjectRequest = Partial<{
  slug: string;
  isFeatured: boolean;
  isArchived: boolean;
  coverImagePath: string | null;
  youtubeUrl: string | null;
  galleryImages: string[] | null;
  projectDate: string | null;
}>;

export type UpsertProjectTranslationRequest = {
  language: "en" | "hi" | "mr";
  status?: "draft" | "published";
  title: string;
  summary?: string | null;
  contentHtml: string;
};

export type CreateEventRequest = {
  slug: string;
  startDate?: string | null;
  endDate?: string | null;
  registrationStartDate?: string | null;
  registrationEndDate?: string | null;
  coverImagePath?: string | null;
  flyerImagePath?: string | null;
  flyerText?: string | null;
  registrationFormUrl?: string | null;
  registrationFormFields?: FormField[] | null;
  eventPrice?: string | null;
  participationType?: string | null;
  galleryImages?: string[] | null;
  translations: Array<{
    language: "en" | "hi" | "mr";
    status?: "draft" | "published";
    title: string;
    location?: string | null;
    summary?: string | null;
    introduction?: string | null;
    requirements?: string | null;
    contentHtml: string;
  }>;
};

export type FormField = {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox";
  required: boolean;
  options?: string[];
};

export type UpdateEventRequest = Partial<{
  slug: string;
  isArchived: boolean;
  isFeatured: boolean;
  registrationOpen: boolean;
  startDate: string | null;
  endDate: string | null;
  registrationStartDate: string | null;
  registrationEndDate: string | null;
  coverImagePath: string | null;
  flyerImagePath: string | null;
  flyerText: string | null;
  registrationFormUrl: string | null;
  registrationFormFields: FormField[] | null;
  eventPrice: string | null;
  participationType: string | null;
  galleryImages: string[] | null;
}>;

export type UpsertEventTranslationRequest = {
  language: "en" | "hi" | "mr";
  status?: "draft" | "published";
  title: string;
  location?: string | null;
  summary?: string | null;
  introduction?: string | null;
  requirements?: string | null;
  contentHtml: string;
};

export type HomeFeaturedResponse = {
  featuredProjects: Array<{
    project: Project;
    translations: ProjectTranslation[];
  }>;
};

export type ProjectsListResponse = Array<{
  project: Project;
  translations: ProjectTranslation[];
}>;

export type EventsListResponse = Array<{
  event: Event;
  translations: EventTranslation[];
}>;

export interface UploadUrlResponse {
  uploadURL: string;
  objectPath: string;
  metadata: {
    name: string;
    size?: number;
    contentType?: string;
  };
}
