"use client";

import { useActionState, useState } from "react";
import { provisionPartner } from "@/app/operator/actions";

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
