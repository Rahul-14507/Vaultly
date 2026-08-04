import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

const adminPassword = process.env.VAULT_ADMIN_PASSWORD;
const jwtSecret = process.env.JWT_SECRET || "default-vaultly-secret-key";

// Pre-calculate the hash of the admin password on startup for timing attack resistance
const hashedAdminPassword = adminPassword ? bcrypt.hashSync(adminPassword, 12) : null;

// POST /api/auth/login
// Request: { password }
// Response: { token }
router.post("/login", (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!adminPassword) {
      res.status(500).json({ error: "Server Configuration Error: VAULT_ADMIN_PASSWORD is not set in .env" });
      return;
    }

    if (!password || typeof password !== "string") {
      res.status(400).json({ error: "Password is required and must be a string" });
      return;
    }

    const isMatch = hashedAdminPassword ? bcrypt.compareSync(password, hashedAdminPassword) : false;

    if (!isMatch) {
      res.status(401).json({ error: "Unauthorized: Invalid password" });
      return;
    }

    // Sign long-lived token (30 days)
    const token = jwt.sign({ role: "admin" }, jwtSecret, { expiresIn: "30d" });

    res.json({ token });
  } catch (err) {
    console.error("Login Handler Error:", err);
    res.status(500).json({ error: "Internal Server Error during auth" });
  }
});

// GET /api/auth/verify
// Verifies if the token is valid (useful for UI checks)
router.get("/verify", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ valid: false });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    jwt.verify(token, jwtSecret);
    res.json({ valid: true });
  } catch (err) {
    res.status(401).json({ valid: false });
  }
});

export default router;
