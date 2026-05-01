import { and, desc, eq, inArray } from "drizzle-orm";
import {
  admins, events, eventTranslations, projects, projectTranslations,
  type Admin, type CreateAdminDbRequest, type CreateEventRequest,
  type CreateProjectRequest, type Event, type EventTranslation,
  type EventsListResponse, type HomeFeaturedResponse, type Project,
  type ProjectTranslation, type ProjectsListResponse,
  type UpdateAdminRequest, type UpdateEventRequest, type UpdateProjectRequest,
  type UpsertEventTranslationRequest, type UpsertProjectTranslationRequest,
} from "@shared/schema";
import { db, pool } from "./db";

function toDate(v: string | null | undefined): Date | null | undefined {
  if (v === undefined) return undefined;
  return v ? new Date(v) : null;
}

async function getProjectWithTranslations(id: number) {
  const result = await pool.query(`SELECT * FROM projects WHERE id = $1`, [id]);
  if (!result.rows.length) return undefined;
  const p = result.rows[0];
  const trans = await db.select().from(projectTranslations).where(eq(projectTranslations.projectId, id));
  return {
    project: {
      id: p.id, slug: p.slug, isFeatured: p.is_featured, isArchived: p.is_archived,
      coverImagePath: p.cover_image_path, youtubeUrl: p.youtube_url,
      galleryImages: p.gallery_images, projectDate: p.project_date,
      createdByAdminId: p.created_by_admin_id, createdAt: p.created_at, updatedAt: p.updated_at,
    },
    translations: trans
  };
}

async function getEventWithTranslations(id: number) {
  const [e] = await db.select().from(events).where(eq(events.id, id));
  if (!e) return undefined;
  const trans = await db.select().from(eventTranslations).where(eq(eventTranslations.eventId, id));
  return { event: e, translations: trans };
}

export class DatabaseStorage {
  // ── Admins ──────────────────────────────────────────────────────────────────

  async getAdminByUserId(userId: string): Promise<Admin | undefined> {
    const [row] = await db.select().from(admins).where(eq(admins.userId, userId));
    return row;
  }

  async listAdmins(): Promise<Admin[]> {
    return db.select().from(admins).orderBy(desc(admins.id));
  }

  async createAdmin(req: CreateAdminDbRequest): Promise<Admin> {
    const [row] = await db.insert(admins).values({ userId: req.userId, role: req.role }).returning();
    return row;
  }

  async updateAdmin(id: number, updates: UpdateAdminRequest): Promise<Admin | undefined> {
    const [row] = await db.update(admins).set(updates).where(eq(admins.id, id)).returning();
    return row;
  }

  // ── Projects ─────────────────────────────────────────────────────────────────

  async listProjects(params?: { featured?: boolean; includeArchived?: boolean }): Promise<ProjectsListResponse> {
    const whereClauses: string[] = [];
    if (params?.featured !== undefined) whereClauses.push(`is_featured = ${params.featured}`);
    if (!params?.includeArchived) whereClauses.push(`is_archived = false`);
    const whereStr = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const result = await pool.query(`SELECT * FROM projects ${whereStr} ORDER BY updated_at DESC`);
    const projRows = result.rows as any[];

    if (!projRows.length) return [];

    const ids = projRows.map((p: any) => p.id);
    const trans = await db.select().from(projectTranslations).where(inArray(projectTranslations.projectId, ids));

    const byProject = new Map<number, ProjectTranslation[]>();
    for (const t of trans) {
      const arr = byProject.get(t.projectId) ?? [];
      arr.push(t);
      byProject.set(t.projectId, arr);
    }

    return projRows.map((p: any) => ({
      project: {
        id: p.id, slug: p.slug, isFeatured: p.is_featured, isArchived: p.is_archived,
        coverImagePath: p.cover_image_path, youtubeUrl: p.youtube_url,
        galleryImages: p.gallery_images, projectDate: p.project_date,
        createdByAdminId: p.created_by_admin_id, createdAt: p.created_at, updatedAt: p.updated_at,
      },
      translations: byProject.get(p.id) ?? []
    }));
  }

  async getProject(id: number) {
    return getProjectWithTranslations(id);
  }

  async createProject(adminId: number, req: CreateProjectRequest) {
    const [p] = await db.insert(projects).values({
      slug: req.slug,
      isFeatured: !!req.isFeatured,
      isArchived: false,
      projectDate: req.projectDate ? new Date(req.projectDate) : null,
      coverImagePath: req.coverImagePath ?? null,
      youtubeUrl: (req as any).youtubeUrl ?? null,
      galleryImages: (req as any).galleryImages ?? null,
      createdByAdminId: adminId,
    }).returning();

    const trans = req.translations.length
      ? await db.insert(projectTranslations).values(
          req.translations.map((t) => ({
            projectId: p.id,
            language: t.language,
            status: t.status ?? "draft" as const,
            title: t.title,
            summary: t.summary ?? null,
            contentHtml: t.contentHtml,
          }))
        ).returning()
      : [];

    return { project: p, translations: trans };
  }

  async updateProject(id: number, updates: UpdateProjectRequest) {
    const [p] = await db.update(projects).set({
      ...(updates.slug !== undefined && { slug: updates.slug }),
      ...(updates.isFeatured !== undefined && { isFeatured: updates.isFeatured }),
      ...(updates.isArchived !== undefined && { isArchived: updates.isArchived }),
      ...(updates.coverImagePath !== undefined && { coverImagePath: updates.coverImagePath }),
      ...(updates.youtubeUrl !== undefined && { youtubeUrl: updates.youtubeUrl }),
      ...(updates.galleryImages !== undefined && { galleryImages: updates.galleryImages }),
      ...(updates.projectDate !== undefined && { projectDate: toDate(updates.projectDate) }),
      updatedAt: new Date(),
    }).where(eq(projects.id, id)).returning();

    if (!p) return undefined;
    const trans = await db.select().from(projectTranslations).where(eq(projectTranslations.projectId, id));
    return { project: p, translations: trans };
  }

  async upsertProjectTranslation(projectId: number, lang: "en" | "hi" | "mr", req: UpsertProjectTranslationRequest) {
    const existing = await getProjectWithTranslations(projectId);
    if (!existing) return undefined;

    const [row] = await db.select().from(projectTranslations)
      .where(and(eq(projectTranslations.projectId, projectId), eq(projectTranslations.language, lang)));

    if (row) {
      await db.update(projectTranslations).set({
        status: req.status ?? row.status,
        title: req.title,
        summary: req.summary ?? null,
        contentHtml: req.contentHtml,
      }).where(eq(projectTranslations.id, row.id));
    } else {
      await db.insert(projectTranslations).values({
        projectId, language: lang,
        status: req.status ?? "draft",
        title: req.title,
        summary: req.summary ?? null,
        contentHtml: req.contentHtml,
      });
    }

    return getProjectWithTranslations(projectId);
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  async setProjectFeatured(id: number, featured: boolean): Promise<void> {
    await db.update(projects).set({ isFeatured: featured, updatedAt: new Date() }).where(eq(projects.id, id));
  }

  async getFeaturedCount(): Promise<number> {
    const result = await pool.query(`SELECT COUNT(*) as value FROM projects WHERE is_featured = true AND is_archived = false`);
    return Number(result.rows[0].value);
  }

  async getHomeFeatured(): Promise<HomeFeaturedResponse> {
    const result = await pool.query(`SELECT * FROM projects WHERE is_featured = true AND is_archived = false ORDER BY updated_at DESC LIMIT 3`);
    const projRows = result.rows as any[];

    if (!projRows.length) return { featuredProjects: [] };

    const ids = projRows.map((p: any) => p.id);
    const trans = await db.select().from(projectTranslations).where(inArray(projectTranslations.projectId, ids));

    const byProject = new Map<number, ProjectTranslation[]>();
    for (const t of trans) {
      const arr = byProject.get(t.projectId) ?? [];
      arr.push(t);
      byProject.set(t.projectId, arr);
    }

    return {
      featuredProjects: projRows.map((p: any) => ({
        project: {
          id: p.id, slug: p.slug, isFeatured: p.is_featured, isArchived: p.is_archived,
          coverImagePath: p.cover_image_path, youtubeUrl: p.youtube_url,
          galleryImages: p.gallery_images, projectDate: p.project_date,
          createdByAdminId: p.created_by_admin_id, createdAt: p.created_at, updatedAt: p.updated_at,
        },
        translations: byProject.get(p.id) ?? []
      }))
    };
  }

  // ── Events ───────────────────────────────────────────────────────────────────

  async listEvents(params?: { includeArchived?: boolean }): Promise<EventsListResponse> {
    const whereStr = params?.includeArchived ? `` : `WHERE is_archived = false`;
    const result = await pool.query(`SELECT * FROM events ${whereStr} ORDER BY start_date DESC NULLS LAST, updated_at DESC`);
    const eventRows = result.rows as any[];
    if (!eventRows.length) return [];

    const ids = eventRows.map((e: any) => e.id);
    const trans = await db.select().from(eventTranslations).where(inArray(eventTranslations.eventId, ids));

    const byEvent = new Map<number, EventTranslation[]>();
    for (const t of trans) {
      const arr = byEvent.get(t.eventId) ?? [];
      arr.push(t);
      byEvent.set(t.eventId, arr);
    }

    return eventRows.map((e: any) => ({
      event: {
        id: e.id, slug: e.slug,
        startDate: e.start_date, endDate: e.end_date,
        registrationStartDate: e.registration_start_date,
        registrationEndDate: e.registration_end_date,
        coverImagePath: e.cover_image_path,
        flyerImagePath: e.flyer_image_path,
        flyerText: e.flyer_text,
        registrationFormUrl: e.registration_form_url,
        registrationFormFields: e.registration_form_fields,
        eventPrice: e.event_price,
        participationType: e.participation_type,
        galleryImages: e.gallery_images,
        isFeatured: e.is_featured,
        isArchived: e.is_archived,
        registrationOpen: e.registration_open,
        createdByAdminId: e.created_by_admin_id,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
      },
      translations: byEvent.get(e.id) ?? []
    }));
  }

  async getEvent(id: number) {
    return getEventWithTranslations(id);
  }

  async createEvent(adminId: number, req: CreateEventRequest) {
    const [e] = await db.insert(events).values({
      slug: req.slug,
      startDate: toDate(req.startDate ?? null) ?? null,
      endDate: toDate(req.endDate ?? null) ?? null,
      registrationStartDate: toDate(req.registrationStartDate ?? null) ?? null,
      registrationEndDate: toDate(req.registrationEndDate ?? null) ?? null,
      coverImagePath: req.coverImagePath ?? null,
      flyerImagePath: req.flyerImagePath ?? null,
      flyerText: req.flyerText ?? null,
      registrationFormUrl: req.registrationFormUrl ?? null,
      registrationFormFields: req.registrationFormFields ?? null,
      eventPrice: req.eventPrice ?? null,
      participationType: req.participationType ?? null,
      galleryImages: (req as any).galleryImages ?? null,
      createdByAdminId: adminId,
    }).returning();

    const trans = req.translations.length
      ? await db.insert(eventTranslations).values(
          req.translations.map((t) => ({
            eventId: e.id,
            language: t.language,
            status: t.status ?? "draft" as const,
            title: t.title,
            location: t.location ?? null,
            summary: t.summary ?? null,
            introduction: t.introduction ?? null,
            requirements: t.requirements ?? null,
            contentHtml: t.contentHtml,
          }))
        ).returning()
      : [];

    return { event: e, translations: trans };
  }

  async updateEvent(id: number, updates: UpdateEventRequest) {
    const [e] = await db.update(events).set({
      ...(updates.slug !== undefined && { slug: updates.slug }),
      ...(updates.isArchived !== undefined && { isArchived: updates.isArchived }),
      ...(updates.isFeatured !== undefined && { isFeatured: updates.isFeatured }),
      ...(updates.startDate !== undefined && { startDate: toDate(updates.startDate) }),
      ...(updates.endDate !== undefined && { endDate: toDate(updates.endDate) }),
      ...(updates.registrationStartDate !== undefined && { registrationStartDate: toDate(updates.registrationStartDate) }),
      ...(updates.registrationEndDate !== undefined && { registrationEndDate: toDate(updates.registrationEndDate) }),
      ...(updates.coverImagePath !== undefined && { coverImagePath: updates.coverImagePath }),
      ...(updates.flyerImagePath !== undefined && { flyerImagePath: updates.flyerImagePath }),
      ...(updates.flyerText !== undefined && { flyerText: updates.flyerText }),
      ...(updates.registrationOpen !== undefined && { registrationOpen: updates.registrationOpen }),
      ...(updates.registrationFormUrl !== undefined && { registrationFormUrl: updates.registrationFormUrl }),
      ...(updates.registrationFormFields !== undefined && { registrationFormFields: updates.registrationFormFields }),
      ...(updates.eventPrice !== undefined && { eventPrice: updates.eventPrice }),
      ...(updates.participationType !== undefined && { participationType: updates.participationType }),
      ...(updates.galleryImages !== undefined && { galleryImages: updates.galleryImages }),
      updatedAt: new Date(),
    }).where(eq(events.id, id)).returning();

    if (!e) return undefined;
    const trans = await db.select().from(eventTranslations).where(eq(eventTranslations.eventId, id));
    return { event: e, translations: trans };
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }

  async upsertEventTranslation(eventId: number, lang: "en" | "hi" | "mr", req: UpsertEventTranslationRequest) {
    const existing = await getEventWithTranslations(eventId);
    if (!existing) return undefined;

    const [row] = await db.select().from(eventTranslations)
      .where(and(eq(eventTranslations.eventId, eventId), eq(eventTranslations.language, lang)));

    if (row) {
      await db.update(eventTranslations).set({
        status: req.status ?? row.status,
        title: req.title,
        location: req.location ?? null,
        summary: req.summary ?? null,
        introduction: req.introduction ?? null,
        requirements: req.requirements ?? null,
        contentHtml: req.contentHtml,
      }).where(eq(eventTranslations.id, row.id));
    } else {
      await db.insert(eventTranslations).values({
        eventId, language: lang,
        status: req.status ?? "draft",
        title: req.title,
        location: req.location ?? null,
        summary: req.summary ?? null,
        introduction: req.introduction ?? null,
        requirements: req.requirements ?? null,
        contentHtml: req.contentHtml,
      });
    }

    return getEventWithTranslations(eventId);
  }
}

export const storage = new DatabaseStorage();
