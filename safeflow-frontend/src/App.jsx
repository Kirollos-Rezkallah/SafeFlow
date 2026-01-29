import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "./components/ConfirmDialogue.jsx";
import { loginWithEmail } from "./api.js";
import { deleteDraft, restoreDraft, useAutosave } from "./hooks/useAutosave.js";

export default function App() {
  const [email, setEmail] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  const [restorableDraft, setRestorableDraft] = useState(null);
  const [showRestore, setShowRestore] = useState(false);

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [announcement, setAnnouncement] = useState("");

  const [form, setForm] = useState({
    examTitle: "Accessible Web Basics",
    question: "Explain how you would build an accessible confirmation dialog.",
    answer: "",
    agree: false,
  });

  const answerRef = useRef(null);

  const autosaveEnabled = isLoggedIn && Boolean(userId);

  const { lastSavedAt, isSaving, saveError } = useAutosave({
    userId,
    data: form,
    enabled: autosaveEnabled,
    intervalMs: 3000,
  });

  // After login, check backend for existing draft and ask user what to do
  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    let alive = true;

    (async () => {
      try {
        const draft = await restoreDraft(userId);
        if (!alive) return;

        if (draft?.data) {
          setRestorableDraft(draft);
          setShowRestore(true);
        } else {
          window.setTimeout(() => answerRef.current?.focus(), 0);
        }
      } catch (e) {
        if (!alive) return;
        setAnnouncement(e?.message || "Failed to load draft");
        window.setTimeout(() => answerRef.current?.focus(), 0);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isLoggedIn, userId]);

  // Warn before real page exit if there is meaningful work
  useEffect(() => {
    if (!autosaveEnabled || !userId) return;

    const hasWork = Boolean(form.answer.trim()) || form.agree;

    const onBeforeUnload = (e) => {
      if (!hasWork) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [autosaveEnabled, userId, form.answer, form.agree]);

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setAnnouncement("");

    try {
      const res = await loginWithEmail(trimmed);
      setUserId(res.userId);
      setIsLoggedIn(true);
    } catch (err) {
      setAnnouncement(err?.message || "Login failed");
    }
  }

  function handleRestoreContinue() {
    if (restorableDraft?.data) setForm(restorableDraft.data);
    setShowRestore(false);
    window.setTimeout(() => answerRef.current?.focus(), 0);
  }

  async function handleRestoreDiscard() {
    try {
      if (userId) await deleteDraft(userId);
    } catch {
      // ignore for MVP
    }

    setForm((p) => ({ ...p, answer: "", agree: false }));
    setShowRestore(false);
    window.setTimeout(() => answerRef.current?.focus(), 0);
  }

  function handleSubmitAttempt(e) {
    e.preventDefault();
    setShowSubmitConfirm(true);
  }

  async function handleConfirmSubmit() {
    setShowSubmitConfirm(false);

    try {
      if (userId) await deleteDraft(userId);
    } catch {
      // ignore for MVP
    }

    setForm((p) => ({ ...p, answer: "", agree: false }));
    setAnnouncement("Submitted. Your server draft was cleared.");
    window.setTimeout(() => answerRef.current?.focus(), 0);
  }

  function handleLogoutAttempt() {
    setShowExitConfirm(true);
  }

  function handleConfirmExit() {
    setShowExitConfirm(false);

    setIsLoggedIn(false);
    setUserId(null);
    setEmail("");
    setRestorableDraft(null);
    setShowRestore(false);
    setShowSubmitConfirm(false);

    setAnnouncement("");
  }

  if (!isLoggedIn) {
    return (
      <main className="container">
        <h1>SafeFlow MVP</h1>
        <p className="card">
          Demo: server-backed auto-save per user, restore after reload, and
          confirmation before submit or exit. Keyboard-first.
        </p>

        <section className="card" aria-labelledby="login-title">
          <h2 id="login-title">Sign in</h2>

          {/* Status messages */}
          <div aria-live="polite" className="sr-only">
            {announcement}
          </div>

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

      {/* Status messages */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <section className="card" aria-labelledby="exam-title">
        <div className="actions" style={{ justifyContent: "space-between" }}>
          <div className="status" aria-live="polite">
            <span className="badge">Signed in as {email}</span>
            <span className="badge">UserId {userId}</span>
            <span className="badge">
              {isSaving
                ? "Saving..."
                : lastSavedAt
                  ? `Saved ${formatTime(lastSavedAt)}`
                  : "Not saved yet"}
            </span>
            {saveError ? (
              <span className="badge">Save error: {saveError}</span>
            ) : null}
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
              aria-describedby="answer-help"
              ref={answerRef}
              value={form.answer}
              onChange={(e) =>
                setForm((p) => ({ ...p, answer: e.target.value }))
              }
            />
            <div className="status" id="answer-help">
              Tip: type, wait 3 seconds, then refresh the page. You should be
              offered a restore option from the server.
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
              onClick={async () => {
                try {
                  if (userId) await deleteDraft(userId);
                } catch {
                  // ignore for MVP
                }
                setForm((p) => ({ ...p, answer: "", agree: false }));
                setAnnouncement("Server draft cleared.");
                window.setTimeout(() => answerRef.current?.focus(), 0);
              }}>
              Clear draft
            </button>
          </div>
        </form>
      </section>

      {/* Restore prompt, user decides */}
      <ConfirmDialog
        open={showRestore}
        title="Restore progress"
        description="We found saved progress on the server. Do you want to continue where you left off, or discard it?"
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
        onCancel={() => setShowExitConfirm(false)}
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
