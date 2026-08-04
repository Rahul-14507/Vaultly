import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db.js";
import { newShortId } from "../utils/shortId.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// POST /api/pastes
// Request body: { content, language?, expiresInHours? }
// Response: { id, url }
router.post("/", requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, language = "plaintext", expiresInHours } = req.body;

    if (!content || typeof content !== "string") {
      res.status(400).json({ error: "Content must be a non-empty string" });
      return;
    }

    const id = newShortId();
    const createdAt = Date.now();
    let expiresAt: number | null = null;

    if (expiresInHours !== undefined && expiresInHours !== null) {
      const hours = Number(expiresInHours);
      if (!isNaN(hours) && hours > 0) {
        expiresAt = createdAt + hours * 60 * 60 * 1000;
      }
    }

    const stmt = db.prepare(`
      INSERT INTO pastes (id, content, language, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, content, language, createdAt, expiresAt);

    // Provide relative URL; frontend can resolve it relative to its origin.
    res.status(201).json({ id, url: `/p/${id}` });
  } catch (error) {
    next(error);
  }
});

// GET /api/pastes/:id/raw
// Response: raw plaintext content of the paste
router.get("/:id/raw", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const stmtSelect = db.prepare("SELECT content, expires_at FROM pastes WHERE id = ?");
    const paste = stmtSelect.get(id) as {
      content: string;
      expires_at: number | null;
    } | undefined;

    if (!paste) {
      res.status(404).send("Paste not found");
      return;
    }

    // Check expiration
    if (paste.expires_at !== null && paste.expires_at < Date.now()) {
      db.prepare("DELETE FROM pastes WHERE id = ?").run(id);
      res.status(404).send("Paste has expired");
      return;
    }

    // Increment views
    db.prepare("UPDATE pastes SET views = views + 1 WHERE id = ?").run(id);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(paste.content);
  } catch (error) {
    next(error);
  }
});

// GET /api/pastes/:id
// Response: { id, content, language, created_at, expires_at, views }
router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const stmtSelect = db.prepare("SELECT * FROM pastes WHERE id = ?");
    const paste = stmtSelect.get(id) as {
      id: string;
      content: string;
      language: string;
      created_at: number;
      expires_at: number | null;
      views: number;
    } | undefined;

    if (!paste) {
      res.status(404).json({ error: "Paste not found" });
      return;
    }

    // Check expiration
    if (paste.expires_at !== null && paste.expires_at < Date.now()) {
      // Clean it up immediately
      db.prepare("DELETE FROM pastes WHERE id = ?").run(id);
      res.status(404).json({ error: "Paste has expired" });
      return;
    }

    // Increment views
    db.prepare("UPDATE pastes SET views = views + 1 WHERE id = ?").run(id);
    paste.views += 1;

    res.json(paste);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/pastes/:id
router.delete("/:id", requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare("DELETE FROM pastes WHERE id = ?");
    const result = stmt.run(id);

    if (result.changes === 0) {
      res.status(404).json({ error: "Paste not found" });
      return;
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
