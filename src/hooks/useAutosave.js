import { useEffect, useRef, useState } from "react";

export function useAutosave({ storageKey, data, enabled, intervalMs = 3000 }) {
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const isFirstRun = useRef(true);

  useEffect(() => {
    if (!enabled) return;

    const save = () => {
      setIsSaving(true);

      window.setTimeout(() => {
        try {
          const payload = {
            data,
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem(storageKey, JSON.stringify(payload));
          setLastSavedAt(payload.savedAt);
        } finally {
          setIsSaving(false);
        }
      }, 50);
    };

    const id = window.setInterval(save, intervalMs);

    if (!isFirstRun.current) save();
    isFirstRun.current = false;

    return () => window.clearInterval(id);
  }, [storageKey, data, enabled, intervalMs]);

  return { lastSavedAt, isSaving };
}

export function restoreDraft(storageKey) {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function deleteDraft(storageKey) {
  localStorage.removeItem(storageKey);
}
