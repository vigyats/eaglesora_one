const isAuthenticated = (_req: any, _res: any, next: any) => {
  // Check if user is authenticated via session
  if (!_req.session?.user) {
    return _res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

import type { Express } from "express";
import type { Server } from "http";
import { z } from "zod";
import { api, errorSchemas } from "@shared/routes";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq, or } from "drizzle-orm";
import { processDonation } from "./services/donation.service";
import { getAnalytics } from "./services/analytics.service";
import { sendUpdateNotification } from "./services/notification.service";
import { sendAdminCredentials, resetPassword } from "./services/admin.service";
import { getEventRegistrations, sendEventReminders, sendEventThankYou } from "./services/event-registration.service";
import { eventRegistrations, youtubeVideos } from "@shared/schema";
import { registerUploadRoutes } from "./services/upload.service";
import { autoTranslateFields, type Lang } from "./services/translator.service";
//import { isAuthenticated, registerAuthRoutes, setupAuth } from "./replit_integrations/auth";
//import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

function getUserId(req: any): string {
  return req?.session?.user?.claims?.sub;
}

async function requireAdmin(req: any): Promise<{ adminId: number; role: "super_admin" | "admin" }> {
  const userId = getUserId(req);
  const admin = await storage.getAdminByUserId(userId);
  if (!admin || !admin.isActive) {
    throw new Error("FORBIDDEN_NOT_ADMIN");
  }
  return { adminId: admin.id, role: admin.role };
}

// Module-level Azure Translator helper — must be outside registerRoutes so it
// is defined before the route handlers that reference it close over it.
async function callAzureTranslator(
  texts: string[],
  toLangs: string[],
  fromLang?: string
): Promise<Array<{ translations: Array<{ text: string; to: string }> }>> {
  const key    = process.env.MICROSOFT_TRANSLATOR_KEY;
  const region = process.env.MICROSOFT_TRANSLATOR_REGION || "global";
  if (!key) throw new Error("TRANSLATOR_NOT_CONFIGURED");

  const toParams  = toLangs.map((l) => `to=${l}`).join("&");
  const fromParam = fromLang ? `&from=${fromLang}` : "";
  const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&${toParams}${fromParam}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Ocp-Apim-Subscription-Region": region,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(texts.map((t) => ({ Text: t }))),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Azure Translator error:", errText);
    throw new Error(`AZURE_ERROR:${response.status}:${errText}`);
  }

  return response.json();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  //await setupAuth(app);
  //registerAuthRoutes(app);
  //registerObjectStorageRoutes(app);
  registerUploadRoutes(app);

  // Auth endpoints
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { identifier, password, rememberMe } = req.body;
      
      if (!identifier || !password) {
        return res.status(400).json({ message: "Username/email and password are required" });
      }

      // Find user by email or username
      const [user] = await db
        .select()
        .from(users)
        .where(or(eq(users.email, identifier), eq(users.username, identifier)))
        .limit(1);

      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Simple password check (in production, use bcrypt.compare)
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session cookie maxAge based on rememberMe
      if (rememberMe) {
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days
      } else {
        req.session.cookie.expires = undefined; // session cookie — expires on browser close
        req.session.cookie.maxAge = undefined as any;
      }

      // Set user in session and save
      req.session.user = {
        claims: {
          sub: user.id
        }
      };

      // Explicitly save session before responding
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        
        return res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/user", (req: any, res) => {
    // Check if user is in session
    if (!req.session?.user?.claims?.sub) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Return user info from session
    const userId = req.session.user.claims.sub;
    
    // Fetch user from database
    db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(([user]) => {
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        return res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      })
      .catch(() => {
        return res.status(500).json({ message: "Internal error" });
      });
  });

  app.get("/api/logout", (req: any, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });

  app.get(api.admins.me.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const admin = await storage.getAdminByUserId(userId);
    if (!admin || !admin.isActive) {
      return res.json({ isAdmin: false, role: null });
    }
    return res.json({ isAdmin: true, role: admin.role });
  });

  // Admin management (super admin only)
  app.get(api.admins.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const { role } = await requireAdmin(req);
      if (role !== "super_admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const rows = await storage.listAdmins();
      return res.json(rows);
    } catch {
      return res.status(403).json({ message: "Forbidden" });
    }
  });

  app.post(api.admins.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const { role } = await requireAdmin(req);
      if (role !== "super_admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const input = api.admins.create.input.parse(req.body);
      
      // Check if username or email already exists
      const existing = await db
        .select()
        .from(users)
        .where(or(eq(users.email, input.email), eq(users.username, input.username)))
        .limit(1);
      
      if (existing.length > 0) {
        return res.status(400).json({ message: "Username or email already exists", field: "username" });
      }

      // Create user with password (in production, hash with bcrypt)
      const [newUser] = await db
        .insert(users)
        .values({
          username: input.username,
          email: input.email,
          password: input.password, // In production: await bcrypt.hash(input.password, 10)
          firstName: input.username,
          lastName: "",
        })
        .returning();

      // Create admin record
      const row = await storage.createAdmin({ userId: newUser.id, role: input.role });
      
      // Send credentials email
      try {
        await sendAdminCredentials(
          newUser.id,
          input.username,
          input.email,
          input.password,
          input.role
        );
      } catch (emailErr) {
        console.error('Failed to send admin credentials email:', emailErr);
      }
      
      return res.status(201).json(row);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      return res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.admins.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const { role } = await requireAdmin(req);
      if (role !== "super_admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid id", field: "id" });
      }

      const input = api.admins.update.input.parse(req.body);
      const updated = await storage.updateAdmin(id, input);
      if (!updated) {
        return res.status(404).json({ message: "Not found" });
      }
      return res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      return res.status(500).json({ message: "Internal error" });
    }
  });

  // Home featured
  app.get(api.home.featured.path, async (_req, res) => {
    const data = await storage.getHomeFeatured();
    return res.json(data);
  });

  // Projects
  app.get(api.projects.list.path, async (req, res) => {
    const featured = req.query.featured === "true" ? true : req.query.featured === "false" ? false : undefined;
    const includeArchived = req.query.includeArchived === "true";
    const rows = await storage.listProjects({ featured, includeArchived });
    return res.json(rows);
  });

  app.get(api.projects.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const lang = (req.query.lang as "en" | "hi" | "mr") || "en";
    if (Number.isNaN(id)) {
      return res.status(404).json({ message: "Not found" });
    }
    const row = await storage.getProject(id);
    if (!row) {
      return res.status(404).json({ message: "Not found" });
    }
    return res.json(row);
  });

  app.post(api.projects.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const { adminId } = await requireAdmin(req);
      const input = api.projects.create.input.parse(req.body);

      if (input.isFeatured) {
        const count = await storage.getFeaturedCount();
        if (count >= 4) {
          return res.status(400).json({ message: "Only 4 projects can be featured", field: "isFeatured" });
        }
      }

      const created = await storage.createProject(adminId, input);
      
      // Send notification
      await sendUpdateNotification({
        type: 'project',
        action: 'created',
        title: input.translations[0]?.title || input.slug,
        updatedBy: req.session.user.claims.sub,
      }).catch(err => console.error('Notification error:', err));
      
      return res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      if (String(err).includes("FORBIDDEN_NOT_ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      return res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.projects.update.path, isAuthenticated, async (req: any, res) => {
    try {
      await requireAdmin(req);
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(404).json({ message: "Not found" });
      }

      const input = api.projects.update.input.parse(req.body);

      if (input.isFeatured === true) {
        const existing = await storage.getProject(id);
        if (!existing) return res.status(404).json({ message: "Not found" });
        if (!existing.project.isFeatured) {
          const count = await storage.getFeaturedCount();
          if (count >= 4) {
            return res.status(400).json({ message: "Only 4 projects can be featured", field: "isFeatured" });
          }
        }
      }

      const updated = await storage.updateProject(id, input);
      if (!updated) {
        return res.status(404).json({ message: "Not found" });
      }
      
      // Send notification
      await sendUpdateNotification({
        type: 'project',
        action: 'updated',
        title: updated.project.slug,
        updatedBy: req.session.user.claims.sub,
      }).catch(err => console.error('Notification error:', err));
      
      return res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      if (String(err).includes("FORBIDDEN_NOT_ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      return res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      await requireAdmin(req);
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(404).json({ message: "Not found" });
      const ok = await storage.deleteProject(id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      return res.json({ message: "Deleted" });
    } catch (err) {
      if (String(err).includes("FORBIDDEN_NOT_ADMIN")) return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal error" });
    }
  });

  app.put(api.projects.upsertTranslation.path, isAuthenticated, async (req: any, res) => {
    try {
      await requireAdmin(req);
      const id = Number(req.params.id);
      const lang = req.params.lang;
      if (Number.isNaN(id) || !["en", "hi", "mr"].includes(lang)) {
        return res.status(404).json({ message: "Not found" });
      }

      const input = api.projects.upsertTranslation.input.parse(req.body);

      // Save submitted language first — always succeeds even if translation fails
      const updated = await storage.upsertProjectTranslation(id, lang, input);
      if (!updated) return res.status(404).json({ message: "Not found" });

      // Auto-translate to other languages — non-fatal if translator is down
      try {
        const translations = await autoTranslateFields(
          { title: input.title, summary: input.summary, contentHtml: input.contentHtml },
          lang as Lang
        );
        const otherLangs = (["en", "hi", "mr"] as Lang[]).filter((l) => l !== lang);
        await Promise.all(
          otherLangs.map((l) =>
            storage.upsertProjectTranslation(id, l, {
              language: l,
              status: input.status ?? "published",
              title: translations[l].title,
              summary: translations[l].summary ?? null,
              contentHtml: translations[l].contentHtml,
            })
          )
        );
      } catch (transErr) {
        console.error("Auto-translate failed (project), skipping:", transErr);
        // Don't fail the request — the EN save already succeeded
      }

      return res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      if (String(err).includes("FORBIDDEN_NOT_ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      return res.status(500).json({ message: String(err) });
    }
  });

  // Events
  app.get(api.events.list.path, async (req, res) => {
    const includeArchived = req.query.includeArchived === "true";
    const rows = await storage.listEvents({ includeArchived });
    return res.json(rows);
  });

  app.get(api.events.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const lang = (req.query.lang as "en" | "hi" | "mr") || "en";
    if (Number.isNaN(id)) {
      return res.status(404).json({ message: "Not found" });
    }
    const row = await storage.getEvent(id);
    if (!row) {
      return res.status(404).json({ message: "Not found" });
    }
    return res.json(row);
  });

  app.post(api.events.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const { adminId } = await requireAdmin(req);
      const input = api.events.create.input.parse(req.body);
      const created = await storage.createEvent(adminId, input);
      
      // Send notification
      await sendUpdateNotification({
        type: 'event',
        action: 'created',
        title: input.translations[0]?.title || input.slug,
        updatedBy: req.session.user.claims.sub,
      }).catch(err => console.error('Notification error:', err));
      
      return res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      if (String(err).includes("FORBIDDEN_NOT_ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      return res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.events.update.path, isAuthenticated, async (req: any, res) => {
    try {
      await requireAdmin(req);
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(404).json({ message: "Not found" });
      }

      const input = api.events.update.input.parse(req.body);
      const updated = await storage.updateEvent(id, input);
      if (!updated) {
        return res.status(404).json({ message: "Not found" });
      }
      
      // Send notification
      await sendUpdateNotification({
        type: 'event',
        action: 'updated',
        title: updated.event.slug,
        updatedBy: req.session.user.claims.sub,
      }).catch(err => console.error('Notification error:', err));
      
      return res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      if (String(err).includes("FORBIDDEN_NOT_ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      return res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete("/api/events/:id", isAuthenticated, async (req: any, res) => {
    try {
      await requireAdmin(req);
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(404).json({ message: "Not found" });
      const ok = await storage.deleteEvent(id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      return res.json({ message: "Deleted" });
    } catch (err) {
      if (String(err).includes("FORBIDDEN_NOT_ADMIN")) return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal error" });
    }
  });

  app.put(api.events.upsertTranslation.path, isAuthenticated, async (req: any, res) => {
    try {
      await requireAdmin(req);
      const id = Number(req.params.id);
      const lang = req.params.lang;
      if (Number.isNaN(id) || !["en", "hi", "mr"].includes(lang)) {
        return res.status(404).json({ message: "Not found" });
      }

      const input = api.events.upsertTranslation.input.parse(req.body);

      // Save submitted language first — always succeeds even if translation fails
      const updated = await storage.upsertEventTranslation(id, lang, input);
      if (!updated) return res.status(404).json({ message: "Not found" });

      // Auto-translate to other languages — non-fatal if translator is down
      try {
        const translations = await autoTranslateFields(
          {
            title: input.title,
            summary: input.summary,
            contentHtml: input.contentHtml,
            location: input.location,
            introduction: input.introduction,
            requirements: input.requirements,
          },
          lang as Lang
        );
        const otherLangs = (["en", "hi", "mr"] as Lang[]).filter((l) => l !== lang);
        await Promise.all(
          otherLangs.map((l) =>
            storage.upsertEventTranslation(id, l, {
              language: l,
              status: input.status ?? "published",
              title: translations[l].title,
              summary: translations[l].summary ?? null,
              contentHtml: translations[l].contentHtml,
              location: translations[l].location ?? null,
              introduction: translations[l].introduction ?? null,
              requirements: translations[l].requirements ?? null,
            })
          )
        );
      } catch (transErr) {
        console.error("Auto-translate failed (event), skipping:", transErr);
        // Don't fail the request — the EN save already succeeded
      }

      return res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      if (String(err).includes("FORBIDDEN_NOT_ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      return res.status(500).json({ message: String(err) });
    }
  });

  // Donation endpoint
  app.post("/api/donations", async (req, res) => {
    try {
      const { donorName, donorEmail, amount } = req.body;

      console.log("=== DONATION REQUEST ===");
      console.log("Body:", req.body);
      console.log("Email config:", {
        user: process.env.EMAIL_USER,
        hasPassword: !!process.env.EMAIL_APP_PASSWORD
      });

      if (!donorName || !donorEmail || !amount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      console.log("Processing donation:", { donorName, donorEmail, amount });
      
      const result = await processDonation({ donorName, donorEmail, amount });
      
      console.log("Donation processed successfully:", result);
      
      return res.json(result);
    } catch (err) {
      console.error("=== DONATION ERROR ===");
      console.error(err);
      return res.status(500).json({ 
        message: "Failed to process donation",
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });

  // Analytics endpoint
  app.get("/api/analytics", isAuthenticated, async (req: any, res) => {
    try {
      await requireAdmin(req);
      
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const analytics = await getAnalytics(startDate, endDate);
      return res.json(analytics);
    } catch (err) {
      if (String(err).includes("FORBIDDEN_NOT_ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      return res.status(500).json({ message: "Internal error" });
    }
  });

  // Password reset endpoint
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      const success = await resetPassword(token, newPassword);
      
      if (!success) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      return res.json({ message: "Password reset successful" });
    } catch (err) {
      console.error('Password reset error:', err);
      return res.status(500).json({ message: "Internal error" });
    }
  });

  // Event registration endpoints
  app.post("/api/events/:id/register", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      if (Number.isNaN(eventId)) return res.status(400).json({ message: "Invalid event ID" });

      const event = await storage.getEvent(eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });
      if ((event.event as any).registrationOpen === false) return res.status(403).json({ message: "Registration is closed" });

      const { formData } = req.body;
      if (!formData || typeof formData !== 'object') return res.status(400).json({ message: "Form data is required" });

      const [registration] = await db.insert(eventRegistrations).values({ eventId, formData }).returning();
      return res.status(201).json(registration);
    } catch (err) {
      console.error('Event registration error:', err);
      return res.status(500).json({ message: "Failed to register" });
    }
  });

  app.get("/api/events/:id/registrations", isAuthenticated, async (req: any, res) => {
    try {
      await requireAdmin(req);
      const eventId = Number(req.params.id);
      if (Number.isNaN(eventId)) return res.status(400).json({ message: "Invalid event ID" });
      const registrations = await getEventRegistrations(eventId);
      return res.json(registrations);
    } catch (err) {
      if (String(err).includes("FORBIDDEN_NOT_ADMIN")) return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal error" });
    }
  });

  app.get("/api/events/:id/registrations/export", isAuthenticated, async (req: any, res) => {
    try {
      await requireAdmin(req);
      const eventId = Number(req.params.id);
      if (Number.isNaN(eventId)) return res.status(400).json({ message: "Invalid event ID" });
      const registrations = await getEventRegistrations(eventId);
      if (!registrations.length) return res.status(200).send("No registrations");

      const keys = Object.keys(registrations[0].formData as Record<string, any>);
      const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const header = ["ID", "Registered At", ...keys].map(escape).join(",");
      const rows = registrations.map((r: any) => [
        escape(r.id),
        escape(new Date(r.registeredAt).toLocaleString("en-IN")),
        ...keys.map(k => escape((r.formData as any)[k] ?? "")),
      ].join(","));
      const csv = [header, ...rows].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="event-${eventId}-registrations.csv"`);
      return res.send(csv);
    } catch (err) {
      if (String(err).includes("FORBIDDEN_NOT_ADMIN")) return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch("/api/events/:id/registration-open", isAuthenticated, async (req: any, res) => {
    try {
      await requireAdmin(req);
      const eventId = Number(req.params.id);
      if (Number.isNaN(eventId)) return res.status(400).json({ message: "Invalid event ID" });
      const { open } = req.body;
      const updated = await storage.updateEvent(eventId, { registrationOpen: Boolean(open) });
      return res.json(updated);
    } catch (err) {
      if (String(err).includes("FORBIDDEN_NOT_ADMIN")) return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal error" });
    }
  });

  app.post("/api/events/:id/send-reminders", isAuthenticated, async (req: any, res) => {
    try {
      await requireAdmin(req);
      const eventId = Number(req.params.id);
      if (Number.isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const result = await sendEventReminders(eventId);
      return res.json(result);
    } catch (err) {
      if (String(err).includes("FORBIDDEN_NOT_ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      console.error('Send reminders error:', err);
      return res.status(500).json({ message: "Failed to send reminders" });
    }
  });

  app.post("/api/events/:id/send-thank-you", isAuthenticated, async (req: any, res) => {
    try {
      await requireAdmin(req);
      const eventId = Number(req.params.id);
      if (Number.isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const result = await sendEventThankYou(eventId);
      return res.json(result);
    } catch (err) {
      if (String(err).includes("FORBIDDEN_NOT_ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      console.error('Send thank you error:', err);
      return res.status(500).json({ message: "Failed to send thank you emails" });
    }
  });

  // Single-target translate (kept for compatibility)
  app.post("/api/translate", isAuthenticated, async (req: any, res) => {
    try {
      const { texts, toLang, fromLang } = req.body as { texts: string[]; toLang: string; fromLang?: string };
      if (!Array.isArray(texts) || !toLang) {
        return res.status(400).json({ message: "texts[] and toLang are required" });
      }
      const data = await callAzureTranslator(texts, [toLang], fromLang);
      const translated = data.map((item) => item.translations[0]?.text ?? "");
      return res.json({ translated });
    } catch (err) {
      const msg = String(err);
      if (msg.includes("TRANSLATOR_NOT_CONFIGURED")) return res.status(503).json({ message: "Translator not configured" });
      console.error("Translate error:", err);
      return res.status(502).json({ message: "Translation failed" });
    }
  });

  // Batch translate — multiple target languages in ONE Azure API call
  // Query params: ?from=en&to=hi&to=mr
  app.post("/api/translate-batch", isAuthenticated, async (req: any, res) => {
    try {
      const { texts } = req.body as { texts: string[] };
      const fromLang = req.query.from as string | undefined;
      const toLangs  = (Array.isArray(req.query.to) ? req.query.to : [req.query.to]).filter(Boolean) as string[];

      if (!Array.isArray(texts) || !toLangs.length) {
        return res.status(400).json({ message: "texts[] and ?to= are required" });
      }

      const data = await callAzureTranslator(texts, toLangs, fromLang);

      // Group results by target language: { hi: string[], mr: string[] }
      const result: Record<string, string[]> = {};
      for (const lang of toLangs) {
        result[lang] = data.map(
          (item) => item.translations.find((t) => t.to === lang)?.text ?? ""
        );
      }
      return res.json(result);
    } catch (err) {
      const msg = String(err);
      if (msg.includes("TRANSLATOR_NOT_CONFIGURED")) return res.status(503).json({ message: "Translator not configured" });
      console.error("Translate batch error:", err);
      return res.status(502).json({ message: "Translation failed" });
    }
  });

  // YouTube Videos
  app.get("/api/youtube-videos", async (req, res) => {
    const rows = await db.select().from(youtubeVideos).orderBy(youtubeVideos.createdAt);
    const lang = String(req.query.lang || "en").toLowerCase();

    const localized = rows.map(row => ({
      ...row,
      title: (lang === "hi" && row.titleHi) ? row.titleHi
           : (lang === "mr" && row.titleMr) ? row.titleMr
           : row.title,
    }));

    return res.json(localized);
  });

  app.post("/api/youtube-videos", isAuthenticated, async (req: any, res) => {
    try {
      await requireAdmin(req);
      const { url, title } = req.body;
      if (!url || !title) return res.status(400).json({ message: "url and title are required" });

      let titleHi = title;
      let titleMr = title;
      try {
        const ytTranslations = await autoTranslateFields({ title, contentHtml: "" });
        titleHi = ytTranslations.hi.title || title;
        titleMr = ytTranslations.mr.title || title;
      } catch (transErr) {
        console.error("Auto-translate failed (youtube), using EN title:", transErr);
      }

      const [row] = await db.insert(youtubeVideos).values({ url, title, titleHi, titleMr }).returning();
      return res.status(201).json(row);
    } catch (err) {
      if (String(err).includes("FORBIDDEN_NOT_ADMIN")) return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete("/api/youtube-videos/:id", isAuthenticated, async (req: any, res) => {
    try {
      await requireAdmin(req);
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(404).json({ message: "Not found" });
      await db.delete(youtubeVideos).where(eq(youtubeVideos.id, id));
      return res.json({ message: "Deleted" });
    } catch (err) {
      if (String(err).includes("FORBIDDEN_NOT_ADMIN")) return res.status(403).json({ message: "Forbidden" });
      return res.status(500).json({ message: "Internal error" });
    }
  });

  return httpServer;
}
