import { randomBytes } from "node:crypto";
import { db } from "../db.js";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function generateShortId(): string {
  let id = "";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    id += alphabet[bytes[i] % 62];
  }
  return id;
}

export function newShortId(): string {
  const stmt = db.prepare("SELECT 1 FROM pastes WHERE id = ?");
  let id = generateShortId();
  let attempts = 0;
  
  while (stmt.get(id) && attempts < 100) {
    id = generateShortId();
    attempts++;
  }
  
  if (attempts >= 100) {
    throw new Error("Failed to generate a unique short ID after 100 attempts.");
  }
  
  return id;
}
