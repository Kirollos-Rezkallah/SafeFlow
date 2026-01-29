import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "./components/ConfirmDialogue.jsx";
import { deleteDraft, restoreDraft, useAutosave } from "./hooks/useAutosave.js";

function makeStorageKey(userEmail) {
  // Per-user draft storage
  return `safeflow:draft:${userEmail.trim().toLowerCase()}`;
}

export default function App() {
  const [userEmail, setUserEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [showRestore, setShowRestore] = useState(false);
  const [restorableDraft, setRestorableDraft] = useState(null);

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [form, setForm] = useState({
    examTitle: "Accessible Web Basics",
    question: "Explain how you would build an accessible confirmation dialog.",
    answer: "",
    agree: false,
  });

  const answerRef = useRef(null);

  const storageKey = useMemo(() => {
    if (!userEmail) return null;
    return makeStorageKey(userEmail);
  }, [userEmail]);

  const autosaveEnabled = isLoggedIn && Boolean(storageKey);

  const { lastSavedAt, isSaving } = useAutosave({
    storageKey: storageKey ?? "noop",
    data: form,
    enabled: autosaveEnabled,
    intervalMs: 3000,
  });

  // On login, check for restorable draft and ask user what to do (not silent)
  useEffect(() => {
    if (!isLoggedIn || !storageKey) return;

    const draft = restoreDraft(storageKey);
    if (draft?.data) {
      setRestorableDraft(draft);
      setShowRestore(true);
    } else {
      // No draft, focus the answer for fast keyboard use
      window.setTimeout(() => answerRef.current?.focus(), 0);
    }
  }, [isLoggedIn, storageKey]);

  // Warn before leaving if there is meaningful unsent work
  useEffect(() => {
    if (!autosaveEnabled || !storageKey) return;

    const hasWork = Boolean(form.answer.trim()) || form.agree;

    const onBeforeUnload = (e) => {
      if (!hasWork) return;
      // Native browser dialog (best effort) for real page exits
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [autosaveEnabled, storageKey, form.answer, form.agree]);

  function handleLoginSubmit(e) {
    e.preventDefault();
    const trimmed = userEmail.trim();
    if (!trimmed) return;
    setIsLoggedIn(true);
  }

  function handleRestoreContinue() {
    if (restorableDraft?.data) {
      setForm(restorableDraft.data);
    }
    setShowRestore(false);
    window.setTimeout(() => answerRef.current?.focus(), 0);
  }

  function handleRestoreDiscard() {
    if (storageKey) deleteDraft(storageKey);
    setShowRestore(false);
    setForm((prev) => ({ ...prev, answer: "", agree: false }));
    window.setTimeout(() => answerRef.current?.focus(), 0);
  }

  function handleSubmitAttempt(e) {
    e.preventDefault();
    setShowSubmitConfirm(true);
  }

  function handleConfirmSubmit() {
    setShowSubmitConfirm(false);

    // Demo behavior: clear draft and show a status alert
    if (storageKey) deleteDraft(storageKey);

    // Reset "exam attempt"
    setForm((prev) => ({ ...prev, answer: "", agree: false }));

    // Keep focus predictable for keyboard users
    window.setTimeout(() => answerRef.current?.focus(), 0);

    // Minimal success feedback (use aria-live region below too)
    setAnnouncement("Submitted. Your draft was cleared.");
  }

  function handleLogoutAttempt() {
    setShowExitConfirm(true);
  }

  function handleConfirmExit() {
    setShowExitConfirm(false);
    setIsLoggedIn(false);
    setUserEmail("");
    setRestorableDraft(null);
    setShowRestore(false);
    setShowSubmitConfirm(false);
    setAnnouncement("");
  }

  function handleCancelExit() {
    setShowExitConfirm(false);
  }

  const [announcement, setAnnouncement] = useState("");

  if (!isLoggedIn) {
    return (
      <main className="container">
        <h1>SafeFlow MVP</h1>
        <p className="card">
          Demo: continuous auto-save per user, restore after reload, and
          confirmation before submit or exit. Keyboard-first.
        </p>

        <section className="card" aria-labelledby="login-title">
          <h2 id="login-title">Sign in</h2>

          <form className="row" onSubmit={handleLoginSubmit}>
            <div className="row">
              <label className="label" htmlFor="email">
                Email (used only to bind drafts)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>

            <div className="actions">
              <button className="primary" type="submit">
                Continue
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>SafeFlow MVP</h1>

      {/* Status messages for assistive tech */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <section className="card" aria-labelledby="exam-title">
        <div className="actions" style={{ justifyContent: "space-between" }}>
          <div className="status" aria-live="polite">
            <span className="badge">Signed in as {userEmail}</span>
            <span className="badge">
              {isSaving
                ? "Saving..."
                : lastSavedAt
                  ? `Saved ${formatTime(lastSavedAt)}`
                  : "Not saved yet"}
            </span>
          </div>

          <button onClick={handleLogoutAttempt}>Exit</button>
        </div>

        <hr />

        <h2 id="exam-title">{form.examTitle}</h2>

        <p>
          <strong>Question:</strong> {form.question}
        </p>

        <form className="row" onSubmit={handleSubmitAttempt}>
          <div className="row">
            <label className="label" htmlFor="answer">
              Your answer
            </label>
            <textarea
              id="answer"
              name="answer"
              ref={answerRef}
              value={form.answer}
              onChange={(e) =>
                setForm((p) => ({ ...p, answer: e.target.value }))
              }
            />
            <div className="status" id="answer-help">
              Tip: Try reloading the page. You should be offered a restore
              option.
            </div>
          </div>

          <div className="row">
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(e) =>
                  setForm((p) => ({ ...p, agree: e.target.checked }))
                }
              />
              I confirm this is my final answer
            </label>
          </div>

          <div className="actions">
            <button
              className="primary"
              type="submit"
              disabled={!form.answer.trim() || !form.agree}>
              Submit exam
            </button>
            <button
              type="button"
              onClick={() => {
                if (storageKey) deleteDraft(storageKey);
                setForm((p) => ({ ...p, answer: "", agree: false }));
                setAnnouncement("Draft cleared.");
                window.setTimeout(() => answerRef.current?.focus(), 0);
              }}>
              Clear draft
            </button>
          </div>
        </form>
      </section>

      {/* Restore dialog shown intentionally, user chooses */}
      <ConfirmDialog
        open={showRestore}
        title="Restore progress"
        description="We found saved progress for this exam. Do you want to continue where you left off, or discard it?"
        confirmText="Continue"
        cancelText="Discard"
        onConfirm={handleRestoreContinue}
        onCancel={handleRestoreDiscard}
      />

      {/* Submit confirmation */}
      <ConfirmDialog
        open={showSubmitConfirm}
        title="Confirm submission"
        description="Submitting is irreversible in this demo. Do you want to submit now?"
        confirmText="Submit"
        cancelText="Go back"
        danger
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowSubmitConfirm(false)}
      />

      {/* Exit confirmation */}
      <ConfirmDialog
        open={showExitConfirm}
        title="Confirm exit"
        description="Exiting may interrupt your workflow. Your progress is saved, but do you really want to exit now?"
        confirmText="Exit"
        cancelText="Stay"
        danger
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
      />
    </main>
  );
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

/* visually hidden utility */
const style = document.createElement("style");
style.innerHTML = `
  .sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0,0,0,0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }
`;
document.head.appendChild(style);
