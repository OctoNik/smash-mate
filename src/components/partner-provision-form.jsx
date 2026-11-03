"use client";

import { useActionState, useState } from "react";
import { provisionPartner, provisionInitialPartners } from "@/app/operator/actions";

const initialState = { error: "", credentials: null };

export default function PartnerProvisionForm() {
  const [state, formAction, pending] = useActionState(provisionPartner, initialState);
  const [copiedPassword, setCopiedPassword] = useState(null);
  async function copyCredentials() {
    if (!state.credentials) return;
    try {
      await navigator.clipboard.writeText(`Email: ${state.credentials.email}\nKata sandi awal: ${state.credentials.initialPassword}`);
      setCopiedPassword(state.credentials.initialPassword);
    } catch { setCopiedPassword(null); }
  }
  return <>
    <form action={formAction} className="mt-5 space-y-4">
      <label className="profile-label">Email Mitra GOR<input name="email" type="email" required autoComplete="off" className="profile-input" /></label>
      <button className="btn btn-dark w-full" type="submit" disabled={pending}>
        {pending ? "Membuat akun..." : "Buat akun Mitra"}
      </button>
    </form>
    {state.error && <p role="alert" className="profile-message error">{state.error}</p>}
    {state.credentials && <div role="status" className="mt-5 rounded-xl border border-court-700/30 bg-court-cream p-4 text-sm">
      <strong>Akun berhasil dibuat</strong>
      <p className="mt-2 break-all">Email: <span className="font-bold">{state.credentials.email}</span></p>
      <p className="mt-1 break-all">Kata sandi awal: <code className="font-bold">{state.credentials.initialPassword}</code></p>
      <p className="mt-3 text-xs leading-5 text-court-950/65">Salin dan berikan langsung kepada Mitra. Kata sandi ini hanya ditampilkan pada hasil pembuatan akun; Mitra wajib menggantinya saat pertama masuk.</p>
      <button type="button" onClick={copyCredentials} className="btn btn-outline-dark mt-3">{copiedPassword === state.credentials.initialPassword ? "Tersalin" : "Salin kredensial"}</button>
    </div>}
  </>;
}

export function InitialProvisionForm({ ready }) {
  const [state, formAction, pending] = useActionState(provisionInitialPartners, { error: "", credentials: [] });
  const [copied, setCopied] = useState(false);
  async function copyAll() {
    try {
      await navigator.clipboard.writeText(state.credentials.map((item) =>
        `${item.venue}\nEmail: ${item.email}\nKata sandi awal: ${item.initialPassword}`).join("\n\n"));
      setCopied(true);
    } catch { setCopied(false); }
  }
  return <>
    {ready && <form action={formAction} className="mt-5">
      <button className="btn btn-dark w-full" type="submit" disabled={pending}>
        {pending ? "Membuat 5 akun..." : "Buat 5 akun Mitra awal"}
      </button>
    </form>}
    {!ready && state.credentials.length === 0 && <p className="mt-4 text-sm text-court-950/65">Akun Mitra sudah terhubung ke GOR. Kredensial awal hanya ditampilkan saat pembuatan akun.</p>}
    {state.error && <p role="alert" className="profile-message error">{state.error}</p>}
    {state.credentials.length === 5 && <div role="status" className="mt-5 rounded-xl border border-court-700/30 bg-court-cream p-4 text-xs">
      <strong>5 akun berhasil dibuat dan dipasangkan ke GOR.</strong>
      <div className="mt-3 space-y-3">{state.credentials.map((item) => <div key={item.email} className="border-t border-court-950/10 pt-3">
        <p className="font-bold">{item.venue}</p>
        <p className="break-all">{item.email}</p>
        <code className="break-all">{item.initialPassword}</code>
      </div>)}</div>
      <p className="mt-3 leading-5 text-court-950/65">Simpan kredensial sekarang. Tiap Mitra wajib mengganti kata sandi awal saat login pertama.</p>
      <button type="button" onClick={copyAll} className="btn btn-outline-dark mt-3">{copied ? "Tersalin" : "Salin semua kredensial"}</button>
    </div>}
  </>;
}
