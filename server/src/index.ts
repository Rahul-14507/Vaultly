import "./loadEnv.js";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
import pastesRouter from "./routes/pastes.js";
import filesRouter from "./routes/files.js";
import authRouter from "./routes/auth.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

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

// Background job to cleanup expired resources (pastes and files)
function cleanupExpiredResources() {
  try {
    const now = Date.now();

    // Pastes cleanup
    const resultPastes = db.prepare("DELETE FROM pastes WHERE expires_at IS NOT NULL AND expires_at < ?").run(now);
    if (resultPastes.changes > 0) {
      console.log(`[Cleanup] Purged ${resultPastes.changes} expired paste(s) from database.`);
    }

    // Files cleanup
    const expiredFiles = db.prepare("SELECT id, stored_path FROM files WHERE expires_at IS NOT NULL AND expires_at < ?").all(now) as { id: string; stored_path: string }[];
    if (expiredFiles.length > 0) {
      for (const file of expiredFiles) {
        try {
          const dirPath = path.dirname(file.stored_path);
          if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
          }
        } catch (diskErr) {
          console.error(`[Cleanup] Failed to delete file directory for ID ${file.id}:`, diskErr);
        }
      }

      const resultFiles = db.prepare("DELETE FROM files WHERE expires_at IS NOT NULL AND expires_at < ?").run(now);
      console.log(`[Cleanup] Purged ${resultFiles.changes} expired file(s) from disk and database.`);
    }
  } catch (error) {
    console.error("[Cleanup] Error running resource cleanup:", error);
  }
}

// Run cleanup immediately on boot, and then every 10 minutes
cleanupExpiredResources();
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
setInterval(cleanupExpiredResources, CLEANUP_INTERVAL);

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Vaultly server listening on port ${PORT} (env: ${process.env.NODE_ENV || "development"})`);
});
