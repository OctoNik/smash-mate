"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/loading-link";
import { logout } from "@/app/auth/actions";
import SubmitButton from "@/components/submit-button";

export default function AccountMenu({ name, email, avatarUrl }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const initial = name.trim().charAt(0).toUpperCase() || "P";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="account-menu" ref={containerRef}>
      <button
        type="button"
        className="account-menu-trigger"
        aria-label={`Buka menu akun ${name}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="account-menu-name"><strong>{name}</strong><small>Player</small></span>
        <span className="account-avatar" aria-hidden="true" style={avatarUrl ? { backgroundImage: `url('${avatarUrl}')`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{avatarUrl ? "" : initial}</span>
      </button>
      {open && (
        <div className="account-menu-panel" role="menu" aria-label="Menu akun">
          <div className="account-menu-identity"><strong>{name}</strong><span>{email}</span></div>
          <Link href="/activities" role="menuitem">Aktivitas</Link>
          <Link href="/equipment" role="menuitem">Perlengkapan</Link>
          <Link href="/ratings" role="menuitem">Rating pemain</Link>
          <Link href="/profile" role="menuitem">Profil saya</Link>
          <Link href="/settings" role="menuitem">Pengaturan</Link>
          <Link href="/feedback" role="menuitem">Kirim feedback</Link>
          <form action={logout}><SubmitButton role="menuitem" pendingText="Sedang keluar...">Keluar dari akun</SubmitButton></form>
        </div>
      )}
    </div>
  );
}
