import { Request, Response, NextFunction } from "express";

// TODO: Phase 3 - Single-user Token Auth middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // For Phase 1 & 2, auth is disabled.
  next();
}
