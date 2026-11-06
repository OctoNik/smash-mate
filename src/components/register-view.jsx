import Link from "@/components/loading-link";
import { register } from "@/app/auth/actions";
import SubmitButton from "@/components/submit-button";

export const instant = false;

export default async function RegisterView({ searchParams }) {
  const { error, message } = await searchParams;
  return (
    <>
      <p className="eyebrow text-court-lime">Buat akun pemain</p>
      <h1 className="font-display text-4xl font-extrabold tracking-[-.045em] text-white">Buat akun SmashMate</h1>
      <p className="mt-3 text-sm leading-6 text-white/75">Semua pengguna mulai sebagai pemain dan bisa menjadi host kegiatan.</p>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-400/25 bg-red-400/8 p-4 text-sm leading-6 text-red-200">{error}</p>}
      {message && <p role="status" className="mt-6 rounded-xl border border-court-lime/25 bg-court-lime/8 p-4 text-sm leading-6 text-court-lime">{message}</p>}
      <form action={register} className="mt-8 space-y-5">
        <label className="form-label">Nama lengkap<input name="name" type="text" autoComplete="name" required placeholder="Nama lengkap Anda…" className="form-input" /></label>
        <label className="form-label">Email<input name="email" type="email" autoComplete="email" spellCheck={false} required placeholder="nama@email.com…" className="form-input" /></label>
        <label className="form-label">Kata sandi<input name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="Minimal 8 karakter…" className="form-input" /></label>
        <p className="text-xs leading-5 text-white/70">Setelah daftar, konfirmasi email Anda untuk masuk dan mulai mencari kegiatan.</p>
        <SubmitButton pendingText="Sedang membuat akun…" className="btn btn-primary btn-large w-full">Buat akun</SubmitButton>
      </form>
      <p className="mt-5 text-center text-sm text-white/75">Sudah punya akun? <Link href="/login" className="font-extrabold text-court-lime hover:text-white">Masuk</Link></p>
    </>
  );
}
