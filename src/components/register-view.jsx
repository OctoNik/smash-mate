import Link from "@/components/loading-link";
import { register } from "@/app/auth/actions";
import SubmitButton from "@/components/submit-button";

export const instant = false;

export default async function RegisterView({ searchParams }) {
  const { error, message } = await searchParams;
  return (
    <>
      <p className="eyebrow text-court-lime">Buat akun pemain</p>
      <h1 className="font-display text-4xl font-extrabold tracking-[-.045em] text-white">Mulai bermain.</h1>
      <p className="mt-3 text-sm leading-6 text-white/45">Semua pengguna mulai sebagai Player. Profil Coach dapat diajukan setelah masuk.</p>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-400/25 bg-red-400/8 p-4 text-sm leading-6 text-red-200">{error}</p>}
      {message && <p className="mt-6 rounded-xl border border-court-lime/25 bg-court-lime/8 p-4 text-sm leading-6 text-court-lime">{message}</p>}
      <form action={register} className="mt-8 space-y-5">
        <label className="form-label">Nama lengkap<input name="name" type="text" autoComplete="name" required placeholder="Nama Anda" className="form-input" /></label>
        <label className="form-label">Email<input name="email" type="email" autoComplete="email" required placeholder="nama@email.com" className="form-input" /></label>
        <label className="form-label">Kata sandi<input name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="Minimal 8 karakter" className="form-input" /></label>
        <div className="flex gap-3 rounded-xl border border-court-lime/15 bg-court-lime/5 p-3"><span className="text-court-lime">✓</span><p className="text-[11px] leading-5 text-white/42">Akun Player dapat mencari mabar, membuat match, mengikuti coaching, dan memberi rating.</p></div>
        <SubmitButton pendingText="Sedang membuat akun..." className="btn btn-primary btn-large w-full">Buat akun saya</SubmitButton>
      </form>
      <p className="mt-6 text-center text-[11px] leading-5 text-white/28">Dengan mendaftar, Anda menyetujui kebijakan privasi dan etika bermain SmashMate.</p>
      <p className="mt-5 text-center text-sm text-white/45">Sudah punya akun? <Link href="/login" className="font-extrabold text-court-lime hover:text-white">Masuk</Link></p>
    </>
  );
}
