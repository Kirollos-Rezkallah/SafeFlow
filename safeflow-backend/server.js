import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { deleteDraft, getDraft, upsertDraft } from "./storage.js";

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

/**
 * CORS: allow frontend to call backend
 */
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: false,
  }),
);

app.use(express.json({ limit: "1mb" }));

/**
 * Simple demo auth:
 * POST /auth/login { email }
 * Returns stable userId derived from email (hash).
 * This is NOT secure. For MVP only.
 */
app.post("/auth/login", (req, res) => {
  const { email } = req.body ?? {};
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  const normalized = email.trim().toLowerCase();
  const userId = crypto
    .createHash("sha256")
    .update(normalized)
    .digest("hex")
    .slice(0, 24);

  return res.json({ userId });
});

/**
 * Draft API:
 * GET /drafts/:userId
 * PUT /drafts/:userId { data }
 * DELETE /drafts/:userId
 */

app.get("/drafts/:userId", async (req, res) => {
  const { userId } = req.params;
  const draft = await getDraft(userId);
  return res.json({ draft });
});

app.put("/drafts/:userId", async (req, res) => {
  const { userId } = req.params;
  const { data } = req.body ?? {};

  if (!data || typeof data !== "object") {
    return res.status(400).json({ error: "data must be an object" });
  }

  const saved = await upsertDraft(userId, data);
  return res.json({ saved });
});

app.delete("/drafts/:userId", async (req, res) => {
  const { userId } = req.params;
  await deleteDraft(userId);
  return res.json({ ok: true });
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`SafeFlow backend running on http://localhost:${PORT}`);
  console.log(`CORS allowed origin: ${FRONTEND_ORIGIN}`);
});
