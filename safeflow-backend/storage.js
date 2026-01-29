import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, "data", "drafts.json");

/**
 * File format:
 * {
 *   "userId": { "data": {...}, "savedAt": "...", "version": 3 }
 * }
 */

async function readAll() {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

async function writeAll(obj) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(obj, null, 2), "utf-8");
}

export async function getDraft(userId) {
  const all = await readAll();
  return all[userId] ?? null;
}

export async function upsertDraft(userId, data) {
  const all = await readAll();
  const prev = all[userId];

  const next = {
    data,
    savedAt: new Date().toISOString(),
    version: prev?.version ? prev.version + 1 : 1,
  };

  all[userId] = next;
  await writeAll(all);
  return next;
}

export async function deleteDraft(userId) {
  const all = await readAll();
  if (all[userId]) delete all[userId];
  await writeAll(all);
}
