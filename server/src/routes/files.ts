import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { db } from "../db.js";
import { newShortId } from "../utils/shortId.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../data/uploads");

// Setup disk storage dynamically under directories named after generated file ID
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const id = newShortId();
    (req as any).fileId = id;
    const fileDir = path.join(uploadsDir, id);
    fs.mkdirSync(fileDir, { recursive: true });
    cb(null, fileDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const maxUploadSizeMb = process.env.MAX_UPLOAD_SIZE_MB ? parseInt(process.env.MAX_UPLOAD_SIZE_MB, 10) : 200;
const maxUploadSizeBytes = maxUploadSizeMb * 1024 * 1024;

const upload = multer({
  storage,
  limits: { fileSize: maxUploadSizeBytes }
});

// POST /api/files
// Multipart form, field name "file"
// Response: { id, url, size_bytes }
router.post("/", requireAuth, (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: `File size exceeds the limit of ${maxUploadSizeMb}MB` });
        return;
      }
      res.status(400).json({ error: err.message || "Failed to upload file" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No file provided in field 'file'" });
      return;
    }

    try {
      const fileId = (req as any).fileId;
      const originalName = req.file.originalname;
      const storedPath = req.file.path;
      const mimeType = req.file.mimetype;
      const sizeBytes = req.file.size;
      const { expiresInHours } = req.body;

      const createdAt = Date.now();
      let expiresAt: number | null = null;

      if (expiresInHours !== undefined && expiresInHours !== null && expiresInHours !== "") {
        const hours = Number(expiresInHours);
        if (!isNaN(hours) && hours > 0) {
          expiresAt = createdAt + hours * 60 * 60 * 1000;
        }
      }

      // Store in DB
      const stmt = db.prepare(`
        INSERT INTO files (id, original_name, stored_path, mime_type, size_bytes, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(fileId, originalName, storedPath, mimeType, sizeBytes, createdAt, expiresAt);

      res.status(201).json({
        id: fileId,
        url: `/f/${fileId}`,
        size_bytes: sizeBytes
      });
    } catch (dbErr) {
      // Cleanup uploaded file if DB insert fails
      if (req.file && req.file.path) {
        const dirPath = path.dirname(req.file.path);
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      }
      next(dbErr);
    }
  });
});

// GET /api/files/:id/info
// Returns file JSON metadata for the UI
router.get("/:id/info", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare("SELECT * FROM files WHERE id = ?");
    const file = stmt.get(id) as {
      id: string;
      original_name: string;
      stored_path: string;
      mime_type: string | null;
      size_bytes: number;
      created_at: number;
      expires_at: number | null;
      downloads: number;
    } | undefined;

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    // Expiry verification
    if (file.expires_at !== null && file.expires_at < Date.now()) {
      db.prepare("DELETE FROM files WHERE id = ?").run(id);
      const dirPath = path.dirname(file.stored_path);
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
      res.status(404).json({ error: "File has expired" });
      return;
    }

    res.json({
      id: file.id,
      original_name: file.original_name,
      mime_type: file.mime_type,
      size_bytes: file.size_bytes,
      created_at: file.created_at,
      expires_at: file.expires_at,
      downloads: file.downloads
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/files/:id
// Streams the file with proper Content-Type and Content-Disposition
router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const isDownload = req.query.download === "true";

    const stmt = db.prepare("SELECT * FROM files WHERE id = ?");
    const file = stmt.get(id) as {
      id: string;
      original_name: string;
      stored_path: string;
      mime_type: string | null;
      size_bytes: number;
      created_at: number;
      expires_at: number | null;
      downloads: number;
    } | undefined;

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    // Expiry verification
    if (file.expires_at !== null && file.expires_at < Date.now()) {
      db.prepare("DELETE FROM files WHERE id = ?").run(id);
      const dirPath = path.dirname(file.stored_path);
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
      res.status(404).json({ error: "File has expired" });
      return;
    }

    // Increment downloads count
    db.prepare("UPDATE files SET downloads = downloads + 1 WHERE id = ?").run(id);

    const absolutePath = path.resolve(file.stored_path);
    if (!fs.existsSync(absolutePath)) {
      res.status(404).json({ error: "Physical file file missing on disk" });
      return;
    }

    const dispositionType = isDownload ? "attachment" : "inline";
    const encodedFilename = encodeURIComponent(file.original_name).replace(/['()]/g, escape);
    
    res.setHeader("Content-Type", file.mime_type || "application/octet-stream");
    res.setHeader("Content-Disposition", `${dispositionType}; filename*=UTF-8''${encodedFilename}`);
    res.sendFile(absolutePath);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/files/:id
// Deletes both the database entry and the files recursively on the disk
router.delete("/:id", requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare("SELECT stored_path FROM files WHERE id = ?");
    const file = stmt.get(id) as { stored_path: string } | undefined;

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    // Delete database entry
    db.prepare("DELETE FROM files WHERE id = ?").run(id);

    // Delete folder directory recursively from disk
    const dirPath = path.dirname(file.stored_path);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
