import { useEffect, useRef } from "react";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
  allowEscape = true,
}) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // Move focus into the dialog
    confirmBtnRef.current?.focus();

    const onKeyDown = (e) => {
      if (!allowEscape) return;
      if (e.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel, allowEscape]);

  if (!open) return null;

  return (
    <div className="backdrop" role="presentation">
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc"
        onClick={(e) => {
          // Prevent backdrop clicks from dismissing the dialog accidentally
          e.stopPropagation();
        }}>
        <h2 id="dialog-title">{title}</h2>
        <p id="dialog-desc">{description}</p>

        <div className="dialog-actions">
          <button onClick={onCancel}>{cancelText}</button>
          <button
            ref={confirmBtnRef}
            className={danger ? "danger" : "primary"}
            onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
