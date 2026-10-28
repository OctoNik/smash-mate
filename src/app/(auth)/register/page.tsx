import Link from "next/link";
import { register } from "@/app/auth/actions";

export const instant = false;

type RegisterPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { error, message } = await searchParams;

  return (
    <>
      <p className="eyebrow">Buat akun baru</p>
      <h1 className="font-display text-4xl font-extrabold text-white">Mulai di SmashMate.</h1>
      <p className="mt-3 leading-7 text-slate-400">Pilih peran awal. Profil dan level bermain dapat dilengkapi setelah akun dibuat.</p>

      {error && <p role="alert" className="mt-6 border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}
      {message && <p className="mt-6 border border-lime/30 bg-lime/10 p-4 text-sm text-lime">{message}</p>}

      <form action={register} className="mt-8 space-y-5">
        <label className="block text-sm font-bold text-slate-200">Nama lengkap
          <input name="name" type="text" autoComplete="name" required placeholder="Nama Anda" className="mt-2 h-13 w-full border border-white/15 bg-navy-900 px-4 font-normal text-white outline-none placeholder:text-slate-600 focus:border-lime" />
        </label>
        <fieldset>
          <legend className="text-sm font-bold text-slate-200">Saya ingin bergabung sebagai</legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <label className="cursor-pointer border border-white/15 bg-navy-900 p-4 has-[:checked]:border-lime has-[:checked]:bg-lime/10">
              <input type="radio" name="role" value="player" defaultChecked className="accent-lime" />
              <strong className="ml-2 text-sm">Player</strong><span className="mt-2 block text-xs leading-5 text-slate-500">Cari mabar, coach, dan event.</span>
            </label>
            <label className="cursor-pointer border border-white/15 bg-navy-900 p-4 has-[:checked]:border-lime has-[:checked]:bg-lime/10">
              <input type="radio" name="role" value="coach" className="accent-lime" />
              <strong className="ml-2 text-sm">Coach</strong><span className="mt-2 block text-xs leading-5 text-slate-500">Buka sesi latihan untuk pemain.</span>
            </label>
          </div>
        </fieldset>
        <label className="block text-sm font-bold text-slate-200">Email
          <input name="email" type="email" autoComplete="email" required placeholder="nama@email.com" className="mt-2 h-13 w-full border border-white/15 bg-navy-900 px-4 font-normal text-white outline-none placeholder:text-slate-600 focus:border-lime" />
        </label>
        <label className="block text-sm font-bold text-slate-200">Kata sandi
          <input name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="Minimal 8 karakter" className="mt-2 h-13 w-full border border-white/15 bg-navy-900 px-4 font-normal text-white outline-none placeholder:text-slate-600 focus:border-lime" />
        </label>
        <p className="text-xs leading-5 text-slate-500">Dengan mendaftar, Anda menyetujui kebijakan privasi dan etika bermain SmashMate.</p>
        <button type="submit" className="h-13 w-full bg-lime px-5 font-extrabold text-navy-950 hover:bg-lime-dark">Buat akun →</button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-400">Sudah punya akun? <Link href="/login" className="font-bold text-lime hover:text-lime-dark">Masuk</Link></p>
      <Link href="/" className="mt-5 block text-center text-xs font-bold text-slate-500 hover:text-white">← Kembali ke landing page</Link>
    </>
  );
}
