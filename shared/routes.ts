import { z } from "zod";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

const lang = z.enum(["en", "hi", "mr"]);

const projectTranslationInput = z.object({
  language: lang,
  status: z.enum(["draft", "published"]).optional(),
  title: z.string().min(1),
  summary: z.string().nullable().optional(),
  contentHtml: z.string().min(1),
});

const eventTranslationInput = z.object({
  language: lang,
  status: z.enum(["draft", "published"]).optional(),
  title: z.string().min(1),
  location: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  introduction: z.string().nullable().optional(),
  requirements: z.string().nullable().optional(),
  contentHtml: z.string().min(1),
});

export const api = {
  me: {
    get: {
      method: "GET" as const,
      path: "/api/auth/user" as const,
      responses: {
        200: z.any(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  home: {
    featured: {
      method: "GET" as const,
      path: "/api/home/featured" as const,
      input: z
        .object({
          lang: lang.optional(),
        })
        .optional(),
      responses: {
        200: z.object({
          featuredProjects: z.array(
            z.object({
              project: z.any(),
              translations: z.array(z.any()),
            }),
          ),
        }),
      },
    },
  },
  admins: {
    me: {
      method: "GET" as const,
      path: "/api/admins/me" as const,
      responses: {
        200: z.object({
          isAdmin: z.boolean(),
          role: z.enum(["super_admin", "admin"]).nullable(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    list: {
      method: "GET" as const,
      path: "/api/admins" as const,
      responses: {
        200: z.array(
          z.object({
            id: z.number(),
            userId: z.string(),
            role: z.enum(["super_admin", "admin"]),
            isActive: z.boolean(),
          }),
        ),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/admins" as const,
      input: z.object({
        username: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["super_admin", "admin"]).default("admin"),
      }),
      responses: {
        201: z.object({
          id: z.number(),
          userId: z.string(),
          role: z.enum(["super_admin", "admin"]),
          isActive: z.boolean(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/admins/:id" as const,
      input: z
        .object({
          role: z.enum(["super_admin", "admin"]).optional(),
          isActive: z.boolean().optional(),
        })
        .refine((v) => Object.keys(v).length > 0, "No changes"),
      responses: {
        200: z.object({
          id: z.number(),
          userId: z.string(),
          role: z.enum(["super_admin", "admin"]),
          isActive: z.boolean(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
  },
  projects: {
    list: {
      method: "GET" as const,
      path: "/api/projects" as const,
      input: z
        .object({
          lang: lang.optional(),
          featured: z.enum(["true", "false"]).optional(),
        })
        .optional(),
      responses: {
        200: z.array(
          z.object({
            project: z.any(),
            translations: z.array(z.any()),
          }),
        ),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/projects/:id" as const,
      input: z.object({ lang: lang.optional() }).optional(),
      responses: {
        200: z.object({ project: z.any(), translations: z.array(z.any()) }),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/projects" as const,
      input: z.object({
        slug: z.string().min(1),
        isFeatured: z.boolean().optional(),
        projectDate: z.string().nullable().optional(),
        coverImagePath: z.string().nullable().optional(),
        youtubeUrl: z.string().nullable().optional(),
        galleryImages: z.array(z.string()).optional(),
        translations: z.array(projectTranslationInput).min(1),
      }),
      responses: {
        201: z.object({ project: z.any(), translations: z.array(z.any()) }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/projects/:id" as const,
      input: z.object({
        slug: z.string().min(1).optional(),
        isFeatured: z.boolean().optional(),
        coverImagePath: z.string().nullable().optional(),
        youtubeUrl: z.string().nullable().optional(),
        galleryImages: z.array(z.string()).nullable().optional(),
        projectDate: z.string().nullable().optional(),
        isArchived: z.boolean().optional(),
      }),
      responses: {
        200: z.object({ project: z.any(), translations: z.array(z.any()) }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/projects/:id" as const,
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    upsertTranslation: {
      method: "PUT" as const,
      path: "/api/projects/:id/translations/:lang" as const,
      input: projectTranslationInput,
      responses: {
        200: z.object({ project: z.any(), translations: z.array(z.any()) }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
  },
  events: {
    list: {
      method: "GET" as const,
      path: "/api/events" as const,
      input: z.object({ lang: lang.optional() }).optional(),
      responses: {
        200: z.array(
          z.object({
            event: z.any(),
            translations: z.array(z.any()),
          }),
        ),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/events/:id" as const,
      input: z.object({ lang: lang.optional() }).optional(),
      responses: {
        200: z.object({ event: z.any(), translations: z.array(z.any()) }),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/events" as const,
      input: z.object({
        slug: z.string().min(1),
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
        registrationStartDate: z.string().nullable().optional(),
        registrationEndDate: z.string().nullable().optional(),
        coverImagePath: z.string().nullable().optional(),
        flyerImagePath: z.string().nullable().optional(),
        flyerText: z.string().nullable().optional(),
        registrationFormUrl: z.string().nullable().optional(),
        eventPrice: z.string().nullable().optional(),
        participationType: z.string().nullable().optional(),
        galleryImages: z.array(z.string()).optional(),
        translations: z.array(eventTranslationInput).min(1),
      }),
      responses: {
        201: z.object({ event: z.any(), translations: z.array(z.any()) }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/events/:id" as const,
      input: z.object({
        slug: z.string().optional(),
        isFeatured: z.boolean().optional(),
        isArchived: z.boolean().optional(),
        registrationOpen: z.boolean().optional(),
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
        registrationStartDate: z.string().nullable().optional(),
        registrationEndDate: z.string().nullable().optional(),
        coverImagePath: z.string().nullable().optional(),
        flyerImagePath: z.string().nullable().optional(),
        flyerText: z.string().nullable().optional(),
        registrationFormUrl: z.string().nullable().optional(),
        registrationFormFields: z.any().nullable().optional(),
        eventPrice: z.string().nullable().optional(),
        participationType: z.string().nullable().optional(),
        galleryImages: z.array(z.string()).nullable().optional(),
      }),
      responses: {
        200: z.object({ event: z.any(), translations: z.array(z.any()) }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/events/:id" as const,
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    upsertTranslation: {
      method: "PUT" as const,
      path: "/api/events/:id/translations/:lang" as const,
      input: eventTranslationInput,
      responses: {
        200: z.object({ event: z.any(), translations: z.array(z.any()) }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
  },
  uploads: {
    requestUrl: {
      method: "POST" as const,
      path: "/api/uploads/request-url" as const,
      input: z.object({
        name: z.string().min(1),
        size: z.number().optional(),
        contentType: z.string().optional(),
      }),
      responses: {
        200: z.object({
          uploadURL: z.string(),
          objectPath: z.string(),
          metadata: z.object({
            name: z.string(),
            size: z.number().optional(),
            contentType: z.string().optional(),
          }),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type HomeFeaturedResponse = z.infer<typeof api.home.featured.responses[200]>;
export type AdminMeResponse = z.infer<typeof api.admins.me.responses[200]>;
export type AdminListResponse = z.infer<typeof api.admins.list.responses[200]>;
export type ProjectListResponse = z.infer<typeof api.projects.list.responses[200]>;
export type ProjectGetResponse = z.infer<typeof api.projects.get.responses[200]>;
export type EventListResponse = z.infer<typeof api.events.list.responses[200]>;
export type EventGetResponse = z.infer<typeof api.events.get.responses[200]>;
