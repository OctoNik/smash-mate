"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({ children, pendingText, className = "", confirmMessage }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className} onClick={confirmMessage ? (event) => { if (!window.confirm(confirmMessage)) event.preventDefault(); } : undefined}>
      {pending && <span className="submit-spinner" aria-hidden="true" />}
      <span aria-live="polite">{pending ? pendingText : children}</span>
    </button>
  );
}
