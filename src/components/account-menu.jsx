"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logout } from "@/app/auth/actions";

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
          <Link href="/activities" role="menuitem" onClick={() => setOpen(false)}>Aktivitas</Link>
          <Link href="/equipment" role="menuitem" onClick={() => setOpen(false)}>Perlengkapan</Link>
          <Link href="/ratings" role="menuitem" onClick={() => setOpen(false)}>Rating pemain</Link>
          <Link href="/profile" role="menuitem" onClick={() => setOpen(false)}>Profil saya</Link>
          <Link href="/settings" role="menuitem" onClick={() => setOpen(false)}>Pengaturan</Link>
          <Link href="/feedback" role="menuitem" onClick={() => setOpen(false)}>Kirim feedback</Link>
          <form action={logout}><button type="submit" role="menuitem">Keluar dari akun</button></form>
        </div>
      )}
    </div>
  );
}
