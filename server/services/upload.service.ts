import type { Express } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

export function registerUploadRoutes(app: Express) {
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

  app.post("/api/uploads/request-url", (req: any, res, next) => {
    // Run multer only for multipart requests
    if (req.is("multipart/form-data")) {
      return upload.single("file")(req, res, next);
    }
    next();
  }, async (req: any, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const ext = (req.file.originalname.split(".").pop() || "bin").toLowerCase();
      const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype || "application/octet-stream",
      }));

      const objectPath = `${PUBLIC_URL}/${key}`;
      return res.json({
        uploadURL: objectPath,
        objectPath,
        metadata: { name: req.file.originalname, size: req.file.size, contentType: req.file.mimetype },
      });
    } catch (err: any) {
      console.error("Upload error:", err?.message, err?.Code, err?.$metadata);
      return res.status(500).json({ message: err?.message || "Upload failed" });
    }
  });
}
