"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { createClient } from "@/lib/supabase/client";

export default function InviteSetup() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    let active = true;
    async function recoverInvite() {
      const supabase = createClient();
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken, refresh_token: refreshToken,
        });
        window.history.replaceState({}, "", "/invite");
        if (sessionError) { if (active) setError("Tautan undangan tidak valid atau kedaluwarsa."); return; }
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (active) {
        if (user?.app_metadata?.smashmate_role === "partner") setReady(true);
        else setError("Undangan Mitra GOR tidak tersedia untuk akun ini.");
      }
    }
    recoverInvite();
    return () => { active = false; };
  }, []);

  async function setAccountPassword(event) {
    event.preventDefault();
    if (password.length < 8 || password !== confirm) {
      setError("Kata sandi minimal 8 karakter dan kedua isian harus sama."); return;
    }
    setBusy(true); setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) { setError("Kata sandi belum dapat disimpan. Coba lagi."); setBusy(false); return; }
    window.location.replace("/partner/setup");
  }

  return <div className="dashboard-shell min-h-screen"><header className="shell py-6"><BrandLogo href="/" /></header>
    <main className="shell flex flex-1 items-center justify-center py-12"><section className="dashboard-card w-full max-w-lg p-7 sm:p-9">
      <p className="eyebrow">Undangan Mitra GOR</p><h1 className="mt-2 font-display text-3xl font-extrabold">Siapkan akun Mitra</h1>
      <p className="mt-3 text-sm leading-6 text-court-950/65">Buat kata sandi untuk mengelola GOR, lapangan, dan katalog perlengkapan.</p>
      {error && <p role="alert" className="profile-message error">{error}</p>}
      {ready ? <form onSubmit={setAccountPassword} className="mt-6 space-y-4">
        <label className="profile-label">Kata sandi baru<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="profile-input" /></label>
        <label className="profile-label">Ulangi kata sandi<input type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(event) => setConfirm(event.target.value)} className="profile-input" /></label>
        <button type="submit" disabled={busy} className="btn btn-dark w-full">{busy ? "Menyimpan..." : "Simpan dan lanjutkan"}</button>
      </form> : !error && <p className="mt-6 text-sm text-court-950/60">Memeriksa undangan...</p>}
      <Link href="/login" className="mt-6 inline-block text-sm font-bold text-court-700 hover:underline">Sudah punya kata sandi? Masuk</Link>
    </section></main></div>;
}
