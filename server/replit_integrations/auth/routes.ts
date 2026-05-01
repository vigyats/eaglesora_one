import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { storage } from "../../storage";

async function upsertUser(claims: any) {
  const user = await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });

  // Automatically promote specified email to super_admin if not already an admin
  if (user.email === "admin@blackai.in" || user.id === "py") {
    const existingAdmin = await storage.getAdminByUserId(user.id);
    if (!existingAdmin) {
      await storage.createAdmin({ userId: user.id, role: "super_admin" });
    } else if (user.id === "py" && existingAdmin.role !== "super_admin") {
      await storage.updateAdmin(existingAdmin.id, { role: "super_admin" });
    }
  }
}

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const claims = req.user.claims;
      await upsertUser(claims);
      const userId = claims.sub;
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
