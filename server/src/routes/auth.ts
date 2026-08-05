import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();
const jwtSecret = process.env.JWT_SECRET || "default-vaultly-secret-key";

// POST /api/auth/register
// Request: { username, password }
// Response: { token, username }
router.post("/register", (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || typeof username !== "string" || username.trim().length < 3) {
      res.status(400).json({ error: "Username must be at least 3 characters long" });
      return;
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long" });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if username is taken
    const existing = db.prepare("SELECT 1 FROM users WHERE username = ?").get(cleanUsername);
    if (existing) {
      res.status(400).json({ error: "Username is already taken" });
      return;
    }

    const userId = randomUUID();
    const passwordHash = bcrypt.hashSync(password, 12);
    const createdAt = Date.now();

    // Save user to database
    db.prepare(`
      INSERT INTO users (id, username, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, cleanUsername, passwordHash, createdAt);

    // Sign and issue JWT
    const token = jwt.sign({ userId, username: cleanUsername }, jwtSecret, { expiresIn: "30d" });

    res.status(201).json({ token, username: cleanUsername });
  } catch (err) {
    console.error("Register Handler Error:", err);
    res.status(500).json({ error: "Internal Server Error during registration" });
  }
});

// POST /api/auth/login
// Request: { username, password }
// Response: { token, username }
router.post("/login", (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password || typeof username !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Fetch user from DB
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(cleanUsername) as {
      id: string;
      username: string;
      password_hash: string;
    } | undefined;

    if (!user) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    // Sign JWT
    const token = jwt.sign({ userId: user.id, username: user.username }, jwtSecret, { expiresIn: "30d" });

    res.json({ token, username: user.username });
  } catch (err) {
    console.error("Login Handler Error:", err);
    res.status(500).json({ error: "Internal Server Error during login" });
  }
});

// GET /api/auth/verify
// Verifies if the token is valid and returns decoded claims
router.get("/verify", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ valid: false });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; username: string };
    res.json({ valid: true, username: decoded.username });
  } catch (err) {
    res.status(401).json({ valid: false });
  }
});

// GET /api/auth/history
// Returns chronological personal upload history (unified pastes and files)
router.get("/history", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    const pastes = db.prepare(`
      SELECT id, language, created_at 
      FROM pastes 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 30
    `).all(userId) as { id: string; language: string; created_at: number }[];

    const files = db.prepare(`
      SELECT id, original_name as name, created_at 
      FROM files 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 30
    `).all(userId) as { id: string; name: string; created_at: number }[];

    // Unify lists and sort chronologically
    const history = [
      ...pastes.map((p) => ({
        id: p.id,
        type: "paste" as const,
        language: p.language,
        created_at: p.created_at
      })),
      ...files.map((f) => ({
        id: f.id,
        type: "file" as const,
        name: f.name,
        created_at: f.created_at
      }))
    ].sort((a, b) => b.created_at - a.created_at).slice(0, 30);

    res.json(history);
  } catch (err) {
    console.error("History Handler Error:", err);
    res.status(500).json({ error: "Internal Server Error loading history" });
  }
});

export default router;
