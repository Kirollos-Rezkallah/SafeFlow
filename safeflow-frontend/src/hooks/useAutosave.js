import { useEffect, useRef, useState } from "react";
import {
  saveDraft,
  getDraft as apiGetDraft,
  deleteDraft as apiDeleteDraft,
} from "../api.js";

/**
 * Auto-saves a draft to the backend on an interval and on change.
 * Returns lastSaved timestamp and saving state.
 */
export function useAutosave({ userId, data, enabled, intervalMs = 3000 }) {
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const isFirstRun = useRef(true);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled || !userId) return;

    const save = async () => {
      if (inFlight.current) return;
      inFlight.current = true;

      setIsSaving(true);
      setSaveError("");

      try {
        const res = await saveDraft(userId, data);
        setLastSavedAt(res?.saved?.savedAt || new Date().toISOString());
      } catch (e) {
        setSaveError(e?.message || "Save failed");
      } finally {
        setIsSaving(false);
        inFlight.current = false;
      }
    };

    const id = window.setInterval(save, intervalMs);

    if (!isFirstRun.current) {
      save();
    }
    isFirstRun.current = false;

    return () => window.clearInterval(id);
  }, [enabled, userId, data, intervalMs]);

  return { lastSavedAt, isSaving, saveError };
}

/**
 * Restore helper from backend.
 */
export async function restoreDraft(userId) {
  const res = await apiGetDraft(userId);
  return res?.draft ?? null;
}

/**
 * Delete helper from backend.
 */
export async function deleteDraft(userId) {
  await apiDeleteDraft(userId);
}
