import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
import pastesRouter from "./routes/pastes.js";
import filesRouter from "./routes/files.js";
import authRouter from "./routes/auth.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend development server
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}));

app.use(express.json());

// Register API Routes
app.use("/api/pastes", pastesRouter);
app.use("/api/files", filesRouter);
app.use("/api/auth", authRouter);

// Background job to cleanup expired pastes
function cleanupExpiredPastes() {
  try {
    const now = Date.now();
    const result = db.prepare("DELETE FROM pastes WHERE expires_at IS NOT NULL AND expires_at < ?").run(now);
    if (result.changes > 0) {
      console.log(`[Cleanup] Purged ${result.changes} expired paste(s) from database.`);
    }
  } catch (error) {
    console.error("[Cleanup] Error running expired pastes cleanup:", error);
  }
}

// Run cleanup immediately on boot, and then every 10 minutes
cleanupExpiredPastes();
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
setInterval(cleanupExpiredPastes, CLEANUP_INTERVAL);

// Serve frontend assets in production
if (process.env.NODE_ENV === "production") {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const frontendDist = path.join(__dirname, "../../web/dist");
  
  app.use(express.static(frontendDist));
  
  // Return frontend SPA router for any non-API routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  // Simple welcome endpoint for dev server test
  app.get("/", (req, res) => {
    res.json({ name: "Vaultly API Server", status: "running" });
  });
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Vaultly server listening on port ${PORT} (env: ${process.env.NODE_ENV || "development"})`);
});
