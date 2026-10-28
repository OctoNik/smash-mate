"use client";

import Link, { useLinkStatus } from "next/link";

function NavigationStatus() {
  const { pending } = useLinkStatus();

  if (!pending) return null;

  return (
    <span className="navigation-pending" role="status">
      <span className="submit-spinner" aria-hidden="true" />
      <span className="sr-only">Memuat halaman...</span>
    </span>
  );
}

export default function LoadingLink({ children, className = "", ...props }) {
  return (
    <Link {...props} className={`loading-link ${className}`}>
      {children}
      <NavigationStatus />
    </Link>
  );
}
